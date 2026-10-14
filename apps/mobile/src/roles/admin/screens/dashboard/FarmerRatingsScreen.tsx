import React, { useState, useMemo } from 'react';
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // #F0562A
  white: adminColors.onBrand,
  canvas: '#FAF8F5',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3ECE4',
  ink: '#111827',
  muted: '#6B7280',
  brandOrange: adminColors.brand,
  brandOrangeTint: '#FDF3F0',
  badgeCompletedBg: '#EAF7EE',
  badgeCompletedText: '#15803D',
  badgeInProgressBg: '#FEF3E2',
  badgeInProgressText: '#B45309',
  badgeNotRatedBg: '#F3F4F6',
  badgeNotRatedText: '#6B7280',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

function HeaderBellIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = THEME.brandOrange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StarActionIcon({ size = 24, color = THEME.brandOrange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PendingRatingsIcon({ size = 24, color = THEME.brandOrange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2.5" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="12" cy="15" r="1" fill={color} />
    </Svg>
  );
}

function HistoryClockIcon({ size = 24, color = THEME.brandOrange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchFarmersIcon({ size = 20, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="20" y1="20" x2="16" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2" fill="#FFFFFF" stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="12" r="2" fill="#FFFFFF" stroke={color} strokeWidth="2" />
      <Circle cx="10" cy="18" r="2" fill="#FFFFFF" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SortUpDownIcon({ size = 18, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 16, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m18 15-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarInputIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function PencilEditIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 38, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="10" width="16" height="11" rx="2.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 10V7a4 4 0 1 1 8 0v3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="15" r="1.3" fill={color} />
      <Line x1="12" y1="16.3" x2="12" y2="18.2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Farmer Data Type & Mock Dataset ─────────────────────────────────────────

export interface CategoryScoreItem {
  name: string;
  score: string;
}

export interface HistoryAuditRecord {
  auditId: string;
  date: string;
  ratedBy: string;
  score: number;
  categories: CategoryScoreItem[];
}

export interface FarmerRecord {
  id: string;
  name: string;
  farm: string;
  zone: 'Ooty' | 'Coonoor' | 'Kotagiri' | 'Gudalur';
  status: 'Completed' | 'In Progress' | 'Not Rated';
  score?: number | undefined;
  trend?: 'Improved' | 'Declined' | 'No Change' | undefined;
  trendDelta?: string | undefined;
  assessedCount: string;
  lastAssessed: string;
  sinceYear: string;
  lastAuditDate: string;
  categories: CategoryScoreItem[];
  history: HistoryAuditRecord[];
}

const DEFAULT_CATEGORIES: CategoryScoreItem[] = [
  { name: 'Certification & Compliance', score: '8/10' },
  { name: 'Soil & Land Management', score: '7/10' },
  { name: 'Farming Practices', score: '8/10' },
  { name: 'Environmental Sustainability', score: '7/10' },
  { name: 'Produce Quality & Yield', score: '8/10' },
  { name: 'Traceability & Transparency', score: '9/10' },
  { name: 'Social & Labor Practices', score: '7/10' },
  { name: 'Financial & Operational', score: '8/10' },
  { name: 'Market & Buyer Relations', score: '8/10' },
  { name: 'Innovation & Improvement', score: '8/10' },
];

const INITIAL_FARMERS: FarmerRecord[] = [
  {
    id: 'FMR-00215',
    name: 'Arun Terrace Farm',
    farm: 'Arun Terrace Farm',
    zone: 'Ooty',
    status: 'Completed',
    score: 58,
    trend: 'No Change',
    assessedCount: '10/10 categories assessed',
    lastAssessed: 'Last assessed 30 Jul 2026',
    sinceYear: '2022',
    lastAuditDate: '30 Jul 2026',
    categories: [
      { name: 'Certification & Compliance', score: '6/10' },
      { name: 'Soil & Land Management', score: '6/10' },
      { name: 'Farming Practices', score: '6/10' },
      { name: 'Environmental Sustainability', score: '5/10' },
      { name: 'Produce Quality & Yield', score: '6/10' },
      { name: 'Traceability & Transparency', score: '6/10' },
      { name: 'Social & Labor Practices', score: '6/10' },
      { name: 'Financial & Operational', score: '5/10' },
      { name: 'Market & Buyer Relations', score: '6/10' },
      { name: 'Innovation & Improvement', score: '6/10' },
    ],
    history: [
      {
        auditId: 'AUD-2026-0028',
        date: '30 Jul 2026',
        ratedBy: 'Suresh Kumar',
        score: 58,
        categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, score: '6/10' })),
      },
    ],
  },
  {
    id: 'FMR-00098',
    name: 'Kumar',
    farm: 'Kumar Valley Farm',
    zone: 'Ooty',
    status: 'Completed',
    score: 82,
    trend: 'Improved',
    trendDelta: '↑ 4',
    assessedCount: '10/10 categories assessed',
    lastAssessed: 'Last assessed 2 Sep 2026',
    sinceYear: '2021',
    lastAuditDate: '2 Sep 2026',
    categories: [
      { name: 'Certification & Compliance', score: '9/10' },
      { name: 'Soil & Land Management', score: '8/10' },
      { name: 'Farming Practices', score: '8/10' },
      { name: 'Environmental Sustainability', score: '8/10' },
      { name: 'Produce Quality & Yield', score: '8/10' },
      { name: 'Traceability & Transparency', score: '9/10' },
      { name: 'Social & Labor Practices', score: '8/10' },
      { name: 'Financial & Operational', score: '8/10' },
      { name: 'Market & Buyer Relations', score: '8/10' },
      { name: 'Innovation & Improvement', score: '8/10' },
    ],
    history: [
      {
        auditId: 'AUD-2026-0036',
        date: '2 Sep 2026',
        ratedBy: 'Suresh Kumar',
        score: 82,
        categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, score: '8/10' })),
      },
    ],
  },
  {
    id: 'FMR-00203',
    name: 'Lakshmi',
    farm: 'Lakshmi Green Farm',
    zone: 'Coonoor',
    status: 'Not Rated',
    score: undefined,
    trend: 'No Change',
    assessedCount: '0/10 categories assessed',
    lastAssessed: 'Not yet assessed',
    sinceYear: '2024',
    lastAuditDate: 'Pending initial audit',
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, score: '0/10' })),
    history: [],
  },
  {
    id: 'FMR-00177',
    name: 'Meena',
    farm: 'Meena Natural Farm',
    zone: 'Coonoor',
    status: 'In Progress',
    score: 90,
    trend: 'Improved',
    assessedCount: '2/10 categories assessed',
    lastAssessed: 'Last assessed 6 Oct 2026',
    sinceYear: '2023',
    lastAuditDate: '6 Oct 2026',
    categories: [
      { name: 'Certification & Compliance', score: '9/10' },
      { name: 'Soil & Land Management', score: '9/10' },
      { name: 'Farming Practices', score: '—' },
      { name: 'Environmental Sustainability', score: '—' },
      { name: 'Produce Quality & Yield', score: '—' },
      { name: 'Traceability & Transparency', score: '—' },
      { name: 'Social & Labor Practices', score: '—' },
      { name: 'Financial & Operational', score: '—' },
      { name: 'Market & Buyer Relations', score: '—' },
      { name: 'Innovation & Improvement', score: '—' },
    ],
    history: [],
  },
  {
    id: 'FMR-00221',
    name: 'Priya',
    farm: 'Kotagiri Green Tea Estate',
    zone: 'Kotagiri',
    status: 'Completed',
    score: 66,
    trend: 'No Change',
    assessedCount: '10/10 categories assessed',
    lastAssessed: 'Last assessed 18 Sep 2026',
    sinceYear: '2022',
    lastAuditDate: '18 Sep 2026',
    categories: [
      { name: 'Certification & Compliance', score: '7/10' },
      { name: 'Soil & Land Management', score: '6/10' },
      { name: 'Farming Practices', score: '7/10' },
      { name: 'Environmental Sustainability', score: '6/10' },
      { name: 'Produce Quality & Yield', score: '7/10' },
      { name: 'Traceability & Transparency', score: '7/10' },
      { name: 'Social & Labor Practices', score: '6/10' },
      { name: 'Financial & Operational', score: '6/10' },
      { name: 'Market & Buyer Relations', score: '7/10' },
      { name: 'Innovation & Improvement', score: '7/10' },
    ],
    history: [],
  },
  {
    id: 'FMR-00152',
    name: 'Vijay',
    farm: 'Vijay Terrace Farm',
    zone: 'Kotagiri',
    status: 'Completed',
    score: 72,
    trend: 'Declined',
    assessedCount: '10/10 categories assessed',
    lastAssessed: 'Last assessed 12 Aug 2026',
    sinceYear: '2023',
    lastAuditDate: '12 Aug 2026',
    categories: [
      { name: 'Certification & Compliance', score: '7/10' },
      { name: 'Soil & Land Management', score: '7/10' },
      { name: 'Farming Practices', score: '7/10' },
      { name: 'Environmental Sustainability', score: '7/10' },
      { name: 'Produce Quality & Yield', score: '7/10' },
      { name: 'Traceability & Transparency', score: '8/10' },
      { name: 'Social & Labor Practices', score: '7/10' },
      { name: 'Financial & Operational', score: '7/10' },
      { name: 'Market & Buyer Relations', score: '8/10' },
      { name: 'Innovation & Improvement', score: '7/10' },
    ],
    history: [],
  },
  {
    id: 'FR-00124',
    name: 'Ramesh Kumar Farming',
    farm: 'Ooty Farm 01',
    zone: 'Ooty',
    status: 'Completed',
    score: 78,
    trend: 'Improved',
    trendDelta: '↑ 2',
    assessedCount: '10/10 categories assessed',
    lastAssessed: 'Last assessed 15 Oct 2026',
    sinceYear: '2023',
    lastAuditDate: '15 Oct 2026',
    categories: DEFAULT_CATEGORIES,
    history: [
      {
        auditId: 'AUD-2026-0042',
        date: '15 Oct 2026',
        ratedBy: 'Suresh Kumar',
        score: 78,
        categories: DEFAULT_CATEGORIES,
      },
      {
        auditId: 'AUD-2026-0031',
        date: '15 Jul 2026',
        ratedBy: 'Suresh Kumar',
        score: 68,
        categories: DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          score: `${Math.max(1, (parseInt(c.score, 10) || 7) - 1)}/10`,
        })),
      },
    ],
  },
  {
    id: 'FMR-00305',
    name: 'Gopal Organic Farm',
    farm: 'Gudalur Spice Estate',
    zone: 'Gudalur',
    status: 'Not Rated',
    score: undefined,
    trend: 'No Change',
    assessedCount: '0/10 categories assessed',
    lastAssessed: 'Not yet assessed',
    sinceYear: '2024',
    lastAuditDate: 'Pending initial audit',
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, score: '0/10' })),
    history: [],
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerRatingsScreenProps {
  onBack: () => void;
  onOpenNotifications?: () => void;
  farmerName?: string;
  farmerId?: string;
}

export function FarmerRatingsScreen({
  onBack,
  onOpenNotifications,
  farmerName,
  farmerId,
}: FarmerRatingsScreenProps) {
  // Navigation view modes:
  // 'overview' | 'list' | 'filter' | 'detail' | 'history' | 'rating_record' | 'edit_rating' | 'review_rating' | 'permission'
  const [currentView, setCurrentView] = useState<
    | 'overview'
    | 'list'
    | 'filter'
    | 'detail'
    | 'history'
    | 'rating_record'
    | 'edit_rating'
    | 'review_rating'
    | 'permission'
  >('overview');

  // Currently viewed farmer
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerRecord>(() => {
    return INITIAL_FARMERS[6] ?? INITIAL_FARMERS[0]!;
  });

  // Selected Audit History record for 'rating_record' screen
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<HistoryAuditRecord>(() => {
    return INITIAL_FARMERS[6]?.history[0] ?? INITIAL_FARMERS[0]!.history[0]!;
  });

  // Editable scores state for 'edit_rating' screen: mapping category name -> score (1 to 10)
  const [editCategoryScores, setEditCategoryScores] = useState<Record<string, number>>(() => {
    const initialMap: Record<string, number> = {};
    DEFAULT_CATEGORIES.forEach((cat) => {
      const num = parseInt(cat.score, 10);
      initialMap[cat.name] = isNaN(num) ? 8 : num;
    });
    return initialMap;
  });

  // Accordion active expanded category name
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    DEFAULT_CATEGORIES[0]?.name ?? null
  );

  // Optional notes per category in 'edit_rating'
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({});

  // Timeframe in Overview: '7 days' | '30 days' | '90 days'
  const [timeframe, setTimeframe] = useState<'7 days' | '30 days' | '90 days'>('7 days');

  // Search query in List View
  const [searchQuery, setSearchQuery] = useState('');

  // Sort Bottom Sheet state
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState<
    'Name (A to Z)' | 'Score: high to low' | 'Score: low to high' | 'Last assessed: newest'
  >('Name (A to Z)');

  // Filter Screen States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterZone, setFilterZone] = useState<'Any' | 'Ooty' | 'Coonoor' | 'Kotagiri' | 'Gudalur'>('Any');
  const [filterStatus, setFilterStatus] = useState<'Any' | 'Not Rated' | 'In Progress' | 'Completed'>('Any');
  const [filterMinScore, setFilterMinScore] = useState('0');
  const [filterMaxScore, setFilterMaxScore] = useState('100');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterTrend, setFilterTrend] = useState<'Any' | 'Improved' | 'Declined' | 'No Change'>('Any');

  // Inline dropdown open state in Filter screen
  const [openDropdown, setOpenDropdown] = useState<'zone' | 'status' | 'trend' | null>(null);

  // Dynamically calculated total score in 'edit_rating' and 'review_rating'
  const calculatedTotalScore = useMemo(() => {
    return Object.values(editCategoryScores).reduce((sum, val) => sum + val, 0);
  }, [editCategoryScores]);

  // Filter & Sort Logic for List View
  const filteredFarmers = useMemo(() => {
    let result = [...INITIAL_FARMERS];

    const q = (filterSearch || searchQuery).trim().toLowerCase();
    if (q) {
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          f.farm.toLowerCase().includes(q)
      );
    }

    if (filterZone !== 'Any') {
      result = result.filter((f) => f.zone === filterZone);
    }

    if (filterStatus !== 'Any') {
      result = result.filter((f) => f.status === filterStatus);
    }

    const minS = parseInt(filterMinScore, 10);
    const maxS = parseInt(filterMaxScore, 10);
    if (!isNaN(minS)) {
      result = result.filter((f) => f.score === undefined || f.score >= minS);
    }
    if (!isNaN(maxS)) {
      result = result.filter((f) => f.score === undefined || f.score <= maxS);
    }

    if (filterTrend !== 'Any') {
      result = result.filter((f) => f.trend === filterTrend);
    }

    if (sortOption === 'Name (A to Z)') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'Score: high to low') {
      result.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else if (sortOption === 'Score: low to high') {
      result.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    } else if (sortOption === 'Last assessed: newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [
    searchQuery,
    filterSearch,
    filterZone,
    filterStatus,
    filterMinScore,
    filterMaxScore,
    filterTrend,
    sortOption,
  ]);

  const handleResetFilters = () => {
    setFilterSearch('');
    setFilterZone('Any');
    setFilterStatus('Any');
    setFilterMinScore('0');
    setFilterMaxScore('100');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterTrend('Any');
    setOpenDropdown(null);
  };

  const openFarmerDetail = (farmer: FarmerRecord) => {
    setSelectedFarmer(farmer);
    // Populate editable scores from farmer's current categories
    const newScores: Record<string, number> = {};
    farmer.categories.forEach((c) => {
      const parsed = parseInt(c.score, 10);
      newScores[c.name] = isNaN(parsed) ? 8 : parsed;
    });
    setEditCategoryScores(newScores);
    if (farmer.history.length > 0 && farmer.history[0]) {
      setSelectedAuditRecord(farmer.history[0]);
    }
    setCurrentView('detail');
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 9: RATING RECORD (Image 5 from latest prompt)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'rating_record') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ── Terracotta Header (Image 5) ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentView('history')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Rating Record</Text>
              <Text style={styles.headerSubtitle}>
                {selectedAuditRecord.auditId} · {selectedAuditRecord.date}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollCanvas}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Metadata Card ── */}
          <View style={styles.recordMetaCard}>
            <Text style={styles.recordMetaLabel}>Farm</Text>
            <Text style={styles.recordMetaFarmName}>{selectedFarmer.farm}</Text>

            <View style={styles.recordMetaGrid}>
              {/* Left Column */}
              <View style={{ flex: 1 }}>
                <Text style={styles.recordMetaLabel}>Farmer</Text>
                <Text style={styles.recordMetaVal}>{selectedFarmer.name}</Text>

                <View style={{ height: 14 }} />

                <Text style={styles.recordMetaLabel}>Rated By</Text>
                <Text style={styles.recordMetaVal}>{selectedAuditRecord.ratedBy}</Text>
              </View>

              {/* Right Column */}
              <View style={{ flex: 1 }}>
                <Text style={styles.recordMetaLabel}>Overall Score</Text>
                <Text style={styles.recordMetaVal}>{selectedAuditRecord.score} / 100</Text>

                <View style={{ height: 14 }} />

                <Text style={styles.recordMetaLabel}>Source Audit</Text>
                <Text style={styles.recordMetaVal}>{selectedAuditRecord.auditId}</Text>
              </View>
            </View>
          </View>

          {/* ── Section: Category Scores (at this rating) ── */}
          <Text style={styles.sectionHeadingDetail}>Category Scores (at this rating)</Text>
          <View style={styles.categoryScoresCard}>
            {selectedAuditRecord.categories.map((cat, idx) => (
              <View
                key={cat.name}
                style={[
                  styles.categoryScoreRow,
                  idx === selectedAuditRecord.categories.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.categoryScoreName}>{cat.name}</Text>
                <Text style={styles.categoryScoreValue}>{cat.score}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 8: RATING HISTORY (Image 3 from latest prompt)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'history') {
    const historyList = selectedFarmer.history.length > 0
      ? selectedFarmer.history
      : [
          {
            auditId: 'AUD-2026-0042',
            date: '15 Oct 2026',
            ratedBy: 'Suresh Kumar',
            score: 78,
            categories: DEFAULT_CATEGORIES,
          },
          {
            auditId: 'AUD-2026-0031',
            date: '15 Jul 2026',
            ratedBy: 'Suresh Kumar',
            score: 68,
            categories: DEFAULT_CATEGORIES.map((c) => ({
              ...c,
              score: `${Math.max(1, (parseInt(c.score, 10) || 7) - 1)}/10`,
            })),
          },
        ];

    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ── Terracotta Header (Image 3) ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentView('detail')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Rating History</Text>
              <Text style={styles.headerSubtitle}>
                {selectedFarmer.name} · {selectedFarmer.id}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollCanvas}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* History Cards */}
          {historyList.map((item, idx) => (
            <TouchableOpacity
              key={item.auditId}
              style={styles.historyCardItem}
              onPress={() => {
                setSelectedAuditRecord(item);
                setCurrentView('rating_record');
              }}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.historyCardDate}>{item.date}</Text>
                <Text style={styles.historyCardSub}>
                  {item.auditId} · Rated by {item.ratedBy}
                </Text>
              </View>

              <Text
                style={[
                  styles.historyCardScore,
                  idx === 0 ? { color: '#047857' } : { color: THEME.brandOrange },
                ]}
              >
                {item.score}/100
              </Text>
            </TouchableOpacity>
          ))}

          {/* Trend Pill Callout Banner (Image 3) */}
          <View style={styles.historyTrendBanner}>
            <Text style={styles.historyTrendBannerText}>
              Trend: +10 points since last rating.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 7: REVIEW RATING (Image 4 from latest prompt)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'review_rating') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ── Terracotta Header (Image 4) ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentView('edit_rating')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Review Rating</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollCanvas}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Summary Card ── */}
          <View style={styles.reviewSummaryCard}>
            <Text style={styles.reviewSummaryLabel}>NEW OVERALL RATING</Text>
            <Text style={styles.reviewSummaryScore}>{calculatedTotalScore} / 100</Text>
            <Text style={styles.reviewSummaryPrevious}>
              Previous: {selectedFarmer.score ?? 68} / 100
            </Text>
          </View>

          {/* ── Section: Category Scores ── */}
          <Text style={styles.sectionHeadingDetail}>Category Scores</Text>
          <View style={styles.categoryScoresCard}>
            {DEFAULT_CATEGORIES.map((cat, idx) => {
              const scoreVal = editCategoryScores[cat.name] || 8;
              return (
                <View
                  key={cat.name}
                  style={[
                    styles.categoryScoreRow,
                    idx === DEFAULT_CATEGORIES.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.categoryScoreName}>{cat.name}</Text>
                  <Text style={styles.categoryScoreValue}>{scoreVal}/10</Text>
                </View>
              );
            })}
          </View>

          {/* Info Notice Banner (Image 4) */}
          <View style={styles.reviewNoticeBanner}>
            <Text style={styles.reviewNoticeText}>
              Submitting locks this rating into the farmer&apos;s history and updates their overall score.
            </Text>
          </View>
        </ScrollView>

        {/* ── Sticky Bottom Button: Submit Rating (Image 4) ── */}
        <View style={styles.detailStickyBottomBar}>
          <TouchableOpacity
            style={styles.submitRatingBtn}
            onPress={() => {
              // Update selected farmer
              const updatedCategories: CategoryScoreItem[] = DEFAULT_CATEGORIES.map((c) => ({
                name: c.name,
                score: `${editCategoryScores[c.name] || 8}/10`,
              }));

              const newAudit: HistoryAuditRecord = {
                auditId: `AUD-2026-00${Math.floor(Math.random() * 50 + 50)}`,
                date: '15 Oct 2026',
                ratedBy: 'Admin User',
                score: calculatedTotalScore,
                categories: updatedCategories,
              };

              setSelectedFarmer((prev) => ({
                ...prev,
                score: calculatedTotalScore,
                categories: updatedCategories,
                history: [newAudit, ...prev.history],
              }));

              Alert.alert(
                'Rating Submitted',
                `Farmer rating for ${selectedFarmer.name} updated to ${calculatedTotalScore}/100 and saved to audit history.`,
                [
                  {
                    text: 'OK',
                    onPress: () => setCurrentView('detail'),
                  },
                ]
              );
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.submitRatingBtnText}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 6: EDIT FARM RATING (Images 1 & 2 from latest prompt)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'edit_rating') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ── Terracotta Header (Image 1) ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentView('detail')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Edit Farm Rating</Text>
              <Text style={styles.headerSubtitle}>
                {selectedFarmer.name} · {selectedFarmer.id}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollCanvas}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Accordion list of all 10 categories with 1-10 selector */}
          {DEFAULT_CATEGORIES.map((cat) => {
            const isExpanded = expandedCategory === cat.name;
            const currentScore = editCategoryScores[cat.name] || 8;

            return (
              <View key={cat.name} style={styles.editAccordionCard}>
                {/* Accordion Header Row */}
                <TouchableOpacity
                  style={styles.editAccordionHeader}
                  onPress={() => setExpandedCategory(isExpanded ? null : cat.name)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editAccordionTitle}>{cat.name}</Text>
                  <View style={styles.editAccordionBadgeWrap}>
                    <View style={styles.scorePillBadge}>
                      <Text style={styles.scorePillBadgeText}>{currentScore}/10</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUpIcon size={16} color="#4B5563" />
                    ) : (
                      <ChevronDownIcon size={16} color="#4B5563" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded 1-10 Score Selector Grid & Notes (Image 1) */}
                {isExpanded && (
                  <View style={styles.editAccordionContent}>
                    {/* Numeric Buttons Grid: 2 rows of 5 */}
                    <View style={styles.scoreButtonsGrid}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isSelected = currentScore === num;
                        return (
                          <TouchableOpacity
                            key={num}
                            style={[
                              styles.scoreNumberBtn,
                              isSelected && styles.scoreNumberBtnSelected,
                            ]}
                            onPress={() => {
                              setEditCategoryScores((prev) => ({
                                ...prev,
                                [cat.name]: num,
                              }));
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.scoreNumberBtnText,
                                isSelected && styles.scoreNumberBtnTextSelected,
                              ]}
                            >
                              {num}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Notes (optional) text area */}
                    <TextInput
                      style={styles.editNotesInput}
                      placeholder="Notes (optional)"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={3}
                      value={categoryNotes[cat.name] || ''}
                      onChangeText={(txt) =>
                        setCategoryNotes((prev) => ({ ...prev, [cat.name]: txt }))
                      }
                    />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* ── Sticky Bottom Button: Review Rating (Image 1 & 2) ── */}
        <View style={styles.detailStickyBottomBar}>
          <TouchableOpacity
            style={styles.reviewRatingBtn}
            onPress={() => setCurrentView('review_rating')}
            activeOpacity={0.85}
          >
            <Text style={styles.reviewRatingBtnText}>Review Rating</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 5: PERMISSION REQUIRED
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'permission') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ── Terracotta Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentView('detail')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Permission Required</Text>
              <Text style={styles.headerSubtitle}>
                {selectedFarmer.name.split(' ')[0]} · {selectedFarmer.id}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Content Box (Image from latest prompt) ── */}
        <View style={styles.canvasCenter}>
          <View style={styles.permissionCard}>
            <LockIcon size={36} color="#374151" />
            <Text style={styles.permissionCardTitle}>Rating Edit Permission Required</Text>
            <Text style={styles.permissionCardDesc}>
              You can view this farmer&apos;s rating, but editing requires permission from the authorized admin. Submit a request to edit ratings for this farmer.
            </Text>
            <TouchableOpacity
              style={styles.permissionBackBtn}
              onPress={() => {
                Alert.alert(
                  'Request Submitted',
                  `Your request to edit ratings for ${selectedFarmer.name} has been sent to the authorized admin.`,
                  [
                    {
                      text: 'Proceed to Edit',
                      onPress: () => setCurrentView('edit_rating'),
                    },
                    {
                      text: 'Back to Details',
                      onPress: () => setCurrentView('detail'),
                    },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionBackBtnText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 4: FARMER RATING DETAIL
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'detail') {
    const overallScore = selectedFarmer.score ?? 78;

    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ── Terracotta Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentView('list')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Farm Rating</Text>
              <Text style={styles.headerSubtitle}>
                {selectedFarmer.name} · {selectedFarmer.id}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollCanvas}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Big Rating Hero Card: Admin Theme Orange (#F0562A) ── */}
          <TouchableOpacity
            style={styles.heroRatingCard}
            onPress={() => setCurrentView('history')}
            activeOpacity={0.88}
          >
            <Text style={styles.heroScoreNum}>{overallScore} / 100</Text>
            <Text style={styles.heroRatingLabel}>OVERALL RATING</Text>
            <Text style={styles.heroRatingDate}>Last rated {selectedFarmer.lastAuditDate} · View History →</Text>
          </TouchableOpacity>

          {/* ── Section: Category Scores ── */}
          <Text style={styles.sectionHeadingDetail}>Category Scores</Text>
          <View style={styles.categoryScoresCard}>
            {selectedFarmer.categories.map((cat, idx) => (
              <View
                key={cat.name}
                style={[
                  styles.categoryScoreRow,
                  idx === selectedFarmer.categories.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.categoryScoreName}>{cat.name}</Text>
                <Text style={styles.categoryScoreValue}>{cat.score}</Text>
              </View>
            ))}
          </View>

          {/* ── Section: Farm Information ── */}
          <Text style={styles.sectionHeadingDetail}>Farm Information</Text>
          <View style={styles.farmInfoCard}>
            <View style={styles.farmInfoGrid}>
              {/* Left Column */}
              <View style={{ flex: 1 }}>
                <Text style={styles.farmInfoLabel}>Farm</Text>
                <Text style={styles.farmInfoValue}>{selectedFarmer.farm}</Text>

                <View style={{ height: 14 }} />

                <Text style={styles.farmInfoLabel}>Farmer Since</Text>
                <Text style={styles.farmInfoValue}>{selectedFarmer.sinceYear}</Text>
              </View>

              {/* Right Column */}
              <View style={{ flex: 1 }}>
                <Text style={styles.farmInfoLabel}>Zone</Text>
                <Text style={styles.farmInfoValue}>{selectedFarmer.zone}</Text>

                <View style={{ height: 14 }} />

                <Text style={styles.farmInfoLabel}>Last Audit</Text>
                <Text style={styles.farmInfoValue}>{selectedFarmer.lastAuditDate}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons below Farm Information */}
          <TouchableOpacity
            style={styles.viewHistoryOutlineBtn}
            onPress={() => setCurrentView('history')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewHistoryOutlineBtnText}>View Rating History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewHistoryOutlineBtn, { marginTop: 8 }]}
            onPress={() => setCurrentView('permission')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewHistoryOutlineBtnText}>Request Edit Permission</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Sticky Bottom Dual Bar: Rating History & Edit Rating ── */}
        <View style={styles.detailStickyBottomBar}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={styles.detailBottomHistoryBtn}
              onPress={() => setCurrentView('history')}
              activeOpacity={0.8}
            >
              <Text style={styles.detailBottomHistoryBtnText}>Rating History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailBottomEditBtn}
              onPress={() => setCurrentView('edit_rating')}
              activeOpacity={0.85}
            >
              <PencilEditIcon size={18} color="#FFFFFF" />
              <Text style={styles.detailBottomEditBtnText}>Edit Rating</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 3: SEARCH & FILTERS WITH EXACT INLINE DROPDOWN
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'filter') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ── Terracotta Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentView('list')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Search & Filters</Text>
              <Text style={styles.headerSubtitle}>Find farmers by zone, score and rating status</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollCanvas}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* White Card Container */}
          <View style={styles.filterCardBox}>
            {/* Field 1: Search farm */}
            <Text style={styles.fieldLabel}>Search farm</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Name, farmer ID or farm name"
              placeholderTextColor="#9CA3AF"
              value={filterSearch}
              onChangeText={setFilterSearch}
            />

            {/* Field 2: Zone with EXACT INLINE DROPDOWN */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Zone</Text>
            <TouchableOpacity
              style={styles.dropdownTriggerBtn}
              onPress={() => setOpenDropdown(openDropdown === 'zone' ? null : 'zone')}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownValText}>{filterZone}</Text>
              <ChevronDownIcon size={16} color="#111827" />
            </TouchableOpacity>

            {/* In-place Dropdown Menu for Zone */}
            {openDropdown === 'zone' && (
              <View style={styles.inlineDropdownMenu}>
                {(['Any', 'Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'] as const).map((opt, idx) => {
                  const isSelected = filterZone === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.inlineDropdownRow,
                        isSelected && styles.inlineDropdownRowSelected,
                        idx > 0 && styles.inlineDropdownRowBorder,
                      ]}
                      onPress={() => {
                        setFilterZone(opt);
                        setOpenDropdown(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.inlineDropdownText,
                          isSelected && styles.inlineDropdownTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Field 3: Rating status with EXACT INLINE DROPDOWN */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Rating status</Text>
            <TouchableOpacity
              style={styles.dropdownTriggerBtn}
              onPress={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownValText}>{filterStatus}</Text>
              <ChevronDownIcon size={16} color="#111827" />
            </TouchableOpacity>

            {/* In-place Dropdown Menu for Rating status */}
            {openDropdown === 'status' && (
              <View style={styles.inlineDropdownMenu}>
                {(['Any', 'Not Rated', 'In Progress', 'Completed'] as const).map((opt, idx) => {
                  const isSelected = filterStatus === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.inlineDropdownRow,
                        isSelected && styles.inlineDropdownRowSelected,
                        idx > 0 && styles.inlineDropdownRowBorder,
                      ]}
                      onPress={() => {
                        setFilterStatus(opt);
                        setOpenDropdown(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.inlineDropdownText,
                          isSelected && styles.inlineDropdownTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.fieldCaptionText}>
              Only the statuses the workflow supports are offered.
            </Text>

            {/* Field 4: Minimum & Maximum Score */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Minimum score</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={filterMinScore}
                  onChangeText={setFilterMinScore}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Maximum score</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={filterMaxScore}
                  onChangeText={setFilterMaxScore}
                />
              </View>
            </View>

            {/* Field 5: Assessed from & Assessed to */}
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Assessed from</Text>
                <View style={styles.dateInputWrap}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor="#9CA3AF"
                    value={filterDateFrom}
                    onChangeText={setFilterDateFrom}
                  />
                  <CalendarInputIcon size={18} color="#9CA3AF" />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Assessed to</Text>
                <View style={styles.dateInputWrap}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor="#9CA3AF"
                    value={filterDateTo}
                    onChangeText={setFilterDateTo}
                  />
                  <CalendarInputIcon size={18} color="#9CA3AF" />
                </View>
              </View>
            </View>

            {/* Field 6: Rating trend with EXACT INLINE DROPDOWN */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Rating trend</Text>
            <TouchableOpacity
              style={styles.dropdownTriggerBtn}
              onPress={() => setOpenDropdown(openDropdown === 'trend' ? null : 'trend')}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownValText}>{filterTrend}</Text>
              <ChevronDownIcon size={16} color="#111827" />
            </TouchableOpacity>

            {/* In-place Dropdown Menu for Rating trend */}
            {openDropdown === 'trend' && (
              <View style={styles.inlineDropdownMenu}>
                {(['Any', 'Improved', 'Declined', 'No Change'] as const).map((opt, idx) => {
                  const isSelected = filterTrend === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.inlineDropdownRow,
                        isSelected && styles.inlineDropdownRowSelected,
                        idx > 0 && styles.inlineDropdownRowBorder,
                      ]}
                      onPress={() => {
                        setFilterTrend(opt);
                        setOpenDropdown(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.inlineDropdownText,
                          isSelected && styles.inlineDropdownTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.fieldCaptionText}>
              Only farmers with at least two completed ratings have a trend.
            </Text>
          </View>

          {/* Action Buttons: Apply Filters | Reset | Cancel */}
          <TouchableOpacity
            style={styles.applyFiltersBtn}
            onPress={() => {
              setOpenDropdown(null);
              setCurrentView('list');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.applyFiltersBtnText}>Apply Filters</Text>
          </TouchableOpacity>

          <View style={styles.filterSubBtnsRow}>
            <TouchableOpacity
              style={styles.filterResetBtn}
              onPress={handleResetFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.filterResetBtnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterCancelBtn}
              onPress={() => {
                setOpenDropdown(null);
                setCurrentView('list');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.filterCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 2: FARM RATINGS LIST VIEW WITH SORT BOTTOM SHEET
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'list') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ── Terracotta Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setCurrentView('overview')}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Farm Ratings</Text>
              <Text style={styles.headerSubtitle}>Farmers in your permitted scope</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollCanvas}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={styles.searchBarBox}>
            <SearchFarmersIcon size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Name, farmer ID or farm"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Action Buttons: Filter & Sort Row */}
          <View style={styles.actionBtnsRow}>
            <TouchableOpacity
              style={styles.filterActionBtn}
              onPress={() => setCurrentView('filter')}
              activeOpacity={0.8}
            >
              <FilterSlidersIcon size={18} color="#374151" />
              <Text style={styles.actionBtnLabel}>Filter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortActionBtn}
              onPress={() => setSortModalVisible(true)}
              activeOpacity={0.8}
            >
              <SortUpDownIcon size={18} color="#374151" />
              <Text style={styles.actionBtnLabel}>Sort</Text>
            </TouchableOpacity>
          </View>

          {/* Farmers Counter */}
          <Text style={styles.farmersCounterText}>{filteredFarmers.length} farmers</Text>

          {/* Farmers Cards List */}
          {filteredFarmers.map((farmer) => (
            <TouchableOpacity
              key={farmer.id}
              style={styles.farmerCard}
              onPress={() => openFarmerDetail(farmer)}
              activeOpacity={0.85}
            >
              {/* Header Row: Name on Left, Score / Dash on Right */}
              <View style={styles.farmerCardHeaderRow}>
                <Text style={styles.farmerCardName}>{farmer.name}</Text>

                {farmer.score !== undefined ? (
                  <View style={styles.scoreRightCol}>
                    <Text style={styles.farmerCardScoreNum}>{farmer.score}</Text>
                    <Text style={styles.farmerCardScoreTotal}>/100</Text>
                    {farmer.trendDelta ? (
                      <Text style={styles.farmerCardTrendUp}>{farmer.trendDelta}</Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.scoreRightCol}>
                    <Text style={styles.farmerCardDash}>—</Text>
                  </View>
                )}
              </View>

              {/* Subtitle Line 1: ID · Farm */}
              <Text style={styles.farmerCardMeta1}>
                {farmer.id} · {farmer.farm}
              </Text>

              {/* Subtitle Line 2: Zone · categories assessed */}
              <Text style={styles.farmerCardMeta2}>
                {farmer.zone} · {farmer.assessedCount}
              </Text>

              {/* Subtitle Line 3: Last assessed date */}
              <Text style={styles.farmerCardMeta3}>{farmer.lastAssessed}</Text>

              {/* Status Badge */}
              <View style={styles.farmerCardBadgeRow}>
                {farmer.status === 'Completed' && (
                  <View style={styles.badgeCompleted}>
                    <Text style={styles.badgeCompletedText}>Completed</Text>
                  </View>
                )}
                {farmer.status === 'In Progress' && (
                  <View style={styles.badgeInProgress}>
                    <Text style={styles.badgeInProgressText}>In Progress</Text>
                  </View>
                )}
                {farmer.status === 'Not Rated' && (
                  <View style={styles.badgeNotRated}>
                    <Text style={styles.badgeNotRatedText}>Not Rated</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Sort by Bottom Sheet Modal ── */}
        <Modal
          visible={sortModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSortModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setSortModalVisible(false)}>
            <View style={styles.bottomSheetBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.bottomSheetBox}>
                  <Text style={styles.bottomSheetTitle}>Sort by</Text>

                  {/* Radio Options List */}
                  {(
                    [
                      'Name (A to Z)',
                      'Score: high to low',
                      'Score: low to high',
                      'Last assessed: newest',
                    ] as const
                  ).map((option) => {
                    const isSelected = sortOption === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={styles.sortRadioRow}
                        onPress={() => {
                          setSortOption(option);
                          setSortModalVisible(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.sortRadioText, isSelected && styles.sortRadioTextActive]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 1: FARM RATINGS OVERVIEW
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.rootOrange}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ── Terracotta Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Farm Ratings</Text>
              <Text style={styles.headerSubtitle}>Monitor farmer assessments and rating history.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={onOpenNotifications || (() => Alert.alert('Notifications', 'No new notifications'))}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <HeaderBellIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollCanvas}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card 1: Recently Updated ── */}
        <View style={styles.recentlyUpdatedCard}>
          <Text style={styles.recentlyUpdatedLabel}>RECENTLY UPDATED</Text>
          <Text style={styles.recentlyUpdatedBigNum}>2</Text>
          <Text style={styles.recentlyUpdatedSub}>farmers updated in the last 7 days</Text>

          {/* Timeframe selector pills */}
          <View style={styles.timeframePillsRow}>
            {(['7 days', '30 days', '90 days'] as const).map((tab) => {
              const isActive = timeframe === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.timeframePill, isActive ? styles.timeframePillActive : styles.timeframePillInactive]}
                  onPress={() => setTimeframe(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.timeframePillText, isActive ? styles.timeframePillTextActive : styles.timeframePillTextInactive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section: Rating Distribution ── */}
        <Text style={styles.sectionHeading}>Rating distribution</Text>
        <View style={styles.distributionCard}>
          {/* Bar 1: 90-100 */}
          <View style={styles.distBarRow}>
            <Text style={styles.distBarLabel}>90–100</Text>
            <View style={styles.distTrack}>
              <View style={[styles.distFill, { width: '20%' }]} />
            </View>
            <Text style={styles.distCount}>1</Text>
          </View>

          {/* Bar 2: 75-89 */}
          <View style={styles.distBarRow}>
            <Text style={styles.distBarLabel}>75–89</Text>
            <View style={styles.distTrack}>
              <View style={[styles.distFill, { width: '20%' }]} />
            </View>
            <Text style={styles.distCount}>1</Text>
          </View>

          {/* Bar 3: 60-74 */}
          <View style={styles.distBarRow}>
            <Text style={styles.distBarLabel}>60–74</Text>
            <View style={styles.distTrack}>
              <View style={[styles.distFill, { width: '60%' }]} />
            </View>
            <Text style={styles.distCount}>3</Text>
          </View>

          {/* Bar 4: Below 60 */}
          <View style={styles.distBarRow}>
            <Text style={styles.distBarLabel}>Below 60</Text>
            <View style={styles.distTrack}>
              <View style={[styles.distFill, { width: '20%' }]} />
            </View>
            <Text style={styles.distCount}>1</Text>
          </View>
        </View>

        {/* Info Callout Banner */}
        <View style={styles.infoBanner}>
          <InfoCircleIcon size={18} color={THEME.brandOrange} />
          <Text style={styles.infoBannerText}>
            These score bands are only a way to group the chart. They are not official TOHFA rating tiers, which have not been confirmed.
          </Text>
        </View>

        {/* ── Section: Recent rating activity ── */}
        <Text style={styles.sectionHeading}>Recent rating activity</Text>

        {/* Card 1: Meena (In Progress) */}
        <View style={styles.activityCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.activityName}>Meena</Text>
            <Text style={styles.activitySub}>FMR-00177 · Coonoor · 6 Oct 2026</Text>
            <View style={styles.badgeInProgress}>
              <Text style={styles.badgeInProgressText}>In Progress</Text>
            </View>
          </View>
          <View style={styles.activityRightCol}>
            <Text style={styles.activityAssessedCount}>2/10 assessed</Text>
            <TouchableOpacity onPress={() => openFarmerDetail(INITIAL_FARMERS[3]!)} activeOpacity={0.7}>
              <Text style={styles.activityViewLink}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: Meena (Completed 90) */}
        <View style={styles.activityCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.activityName}>Meena</Text>
            <Text style={styles.activitySub}>FMR-00177 · Coonoor · 24 Sep 2026</Text>
            <View style={styles.badgeCompleted}>
              <Text style={styles.badgeCompletedText}>Completed</Text>
            </View>
          </View>
          <View style={styles.activityRightCol}>
            <Text style={styles.activityScoreBig}>90</Text>
            <Text style={styles.activityScoreTotal}>/100</Text>
            <TouchableOpacity onPress={() => openFarmerDetail(INITIAL_FARMERS[3]!)} activeOpacity={0.7}>
              <Text style={styles.activityViewLink}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 3: Priya */}
        <View style={styles.activityCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.activityName}>Priya</Text>
            <Text style={styles.activitySub}>FMR-00221 · Kotagiri · 18 Sep 2026</Text>
            <View style={styles.badgeCompleted}>
              <Text style={styles.badgeCompletedText}>Completed</Text>
            </View>
          </View>
          <View style={styles.activityRightCol}>
            <Text style={styles.activityScoreBig}>66</Text>
            <Text style={styles.activityScoreTotal}>/100</Text>
            <TouchableOpacity onPress={() => openFarmerDetail(INITIAL_FARMERS[4]!)} activeOpacity={0.7}>
              <Text style={styles.activityViewLink}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 4: Kumar */}
        <View style={styles.activityCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.activityName}>Kumar</Text>
            <Text style={styles.activitySub}>FMR-00098 · Ooty · 2 Sep 2026</Text>
            <View style={styles.badgeCompleted}>
              <Text style={styles.badgeCompletedText}>Completed</Text>
            </View>
          </View>
          <View style={styles.activityRightCol}>
            <Text style={styles.activityScoreBig}>82</Text>
            <Text style={styles.activityScoreTotal}>/100</Text>
            <TouchableOpacity onPress={() => openFarmerDetail(INITIAL_FARMERS[1]!)} activeOpacity={0.7}>
              <Text style={styles.activityViewLink}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 5: Vijay */}
        <View style={styles.activityCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.activityName}>Vijay</Text>
            <Text style={styles.activitySub}>FMR-00152 · Kotagiri · 12 Aug 2026</Text>
            <View style={styles.badgeCompleted}>
              <Text style={styles.badgeCompletedText}>Completed</Text>
            </View>
          </View>
          <View style={styles.activityRightCol}>
            <Text style={styles.activityScoreBig}>72</Text>
            <Text style={styles.activityScoreTotal}>/100</Text>
            <TouchableOpacity onPress={() => openFarmerDetail(INITIAL_FARMERS[5]!)} activeOpacity={0.7}>
              <Text style={styles.activityViewLink}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section: Quick Actions ── */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Quick actions</Text>
        <View style={styles.quickActionsGrid}>
          {/* Card 1: View All Ratings */}
          <TouchableOpacity
            style={styles.quickActionBox}
            onPress={() => {
              handleResetFilters();
              setCurrentView('list');
            }}
            activeOpacity={0.8}
          >
            <StarActionIcon size={26} color={THEME.brandOrange} />
            <Text style={styles.quickActionTitle}>View All Ratings</Text>
          </TouchableOpacity>

          {/* Card 2: Pending Ratings */}
          <TouchableOpacity
            style={styles.quickActionBox}
            onPress={() => {
              setFilterStatus('In Progress');
              setCurrentView('list');
            }}
            activeOpacity={0.8}
          >
            <PendingRatingsIcon size={26} color={THEME.brandOrange} />
            <Text style={styles.quickActionTitle}>Pending Ratings</Text>
          </TouchableOpacity>

          {/* Card 3: Recent Changes / Rating History */}
          <TouchableOpacity
            style={styles.quickActionBox}
            onPress={() => {
              setCurrentView('history');
            }}
            activeOpacity={0.8}
          >
            <HistoryClockIcon size={26} color={THEME.brandOrange} />
            <Text style={styles.quickActionTitle}>Recent Changes</Text>
          </TouchableOpacity>

          {/* Card 4: Search Farmers */}
          <TouchableOpacity
            style={styles.quickActionBox}
            onPress={() => setCurrentView('filter')}
            activeOpacity={0.8}
          >
            <SearchFarmersIcon size={26} color={THEME.brandOrange} />
            <Text style={styles.quickActionTitle}>Search Farmers</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rootOrange: {
    flex: 1,
    backgroundColor: THEME.headerBg,
  },
  scrollCanvas: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  canvasCenter: {
    flex: 1,
    backgroundColor: THEME.canvas,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Header ──
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Overview Cards ──
  recentlyUpdatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  recentlyUpdatedLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  recentlyUpdatedBigNum: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  recentlyUpdatedSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  timeframePillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  timeframePill: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframePillActive: {
    backgroundColor: THEME.brandOrange,
  },
  timeframePillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeframePillText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  timeframePillTextActive: {
    color: '#FFFFFF',
  },
  timeframePillTextInactive: {
    color: '#374151',
  },

  // ── Rating Distribution ──
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.brandOrange,
    marginTop: 22,
    marginBottom: 10,
  },
  distributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 12,
  },
  distBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  distBarLabel: {
    width: 65,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
  },
  distTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: THEME.brandOrange,
  },
  distCount: {
    width: 20,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },

  infoBanner: {
    backgroundColor: '#FBF5EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: THEME.brandOrange,
    lineHeight: 16,
    marginLeft: 8,
  },

  // ── Recent Activity ──
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  activitySub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  badgeInProgress: {
    backgroundColor: THEME.badgeInProgressBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeInProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.badgeInProgressText,
  },
  badgeCompleted: {
    backgroundColor: THEME.badgeCompletedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeCompletedText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.badgeCompletedText,
  },
  badgeNotRated: {
    backgroundColor: THEME.badgeNotRatedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeNotRatedText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.badgeNotRatedText,
  },
  activityRightCol: {
    alignItems: 'flex-end',
  },
  activityAssessedCount: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  activityScoreBig: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 24,
  },
  activityScoreTotal: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 12,
  },
  activityViewLink: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.brandOrange,
    marginTop: 6,
  },

  // ── Quick Actions Grid ──
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  quickActionBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  // ── List View Screen ──
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  filterActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sortActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  farmersCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 14,
    marginBottom: 8,
  },

  // Farmer Card
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 10,
  },
  farmerCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  farmerCardName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    paddingRight: 8,
  },
  scoreRightCol: {
    alignItems: 'flex-end',
  },
  farmerCardScoreNum: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.brandOrange,
    lineHeight: 24,
  },
  farmerCardScoreTotal: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 14,
  },
  farmerCardTrendUp: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  farmerCardDash: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B7280',
  },
  farmerCardMeta1: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  farmerCardMeta2: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  farmerCardMeta3: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  farmerCardBadgeRow: {
    marginTop: 10,
  },

  // ── Sort Bottom Sheet Modal ──
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  sortRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: THEME.brandOrange,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.brandOrange,
  },
  sortRadioText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  sortRadioTextActive: {
    color: '#111827',
    fontWeight: '800',
  },

  // ── Search & Filter Screen ──
  filterCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  dropdownTriggerBtn: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dropdownValText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  inlineDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  inlineDropdownRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  inlineDropdownRowSelected: {
    backgroundColor: '#6B7280',
  },
  inlineDropdownRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inlineDropdownText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  inlineDropdownTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldCaptionText: {
    fontSize: 11,
    color: THEME.brandOrange,
    marginTop: 4,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  dateInputWrap: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  applyFiltersBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  applyFiltersBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterSubBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  filterResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },
  filterCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },

  // ── Detail Screen Styles ──
  heroRatingCard: {
    backgroundColor: THEME.brandOrange,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScoreNum: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroRatingLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  heroRatingDate: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  sectionHeadingDetail: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.brandOrange,
    marginTop: 20,
    marginBottom: 10,
  },
  categoryScoresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  categoryScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
  },
  categoryScoreName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  categoryScoreValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
  },
  farmInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  farmInfoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  farmInfoLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  farmInfoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  viewHistoryOutlineBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  viewHistoryOutlineBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },
  detailStickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  requestToEditBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.brandOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  requestToEditBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailBottomHistoryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBottomHistoryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },
  detailBottomEditBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.brandOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailBottomEditBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Edit Rating Screen Styles (Image 1 & 2) ──
  editAccordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    overflow: 'hidden',
  },
  editAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  editAccordionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    paddingRight: 8,
  },
  editAccordionBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scorePillBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scorePillBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  editAccordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3ECE4',
    paddingTop: 14,
  },
  scoreButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  scoreNumberBtn: {
    width: '18%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumberBtnSelected: {
    backgroundColor: THEME.brandOrange,
    borderColor: THEME.brandOrange,
  },
  scoreNumberBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  scoreNumberBtnTextSelected: {
    color: '#FFFFFF',
  },
  editNotesInput: {
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    textAlignVertical: 'top',
  },
  reviewRatingBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewRatingBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Review Rating Screen Styles (Image 4) ──
  reviewSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  reviewSummaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  reviewSummaryScore: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },
  reviewSummaryPrevious: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 4,
  },
  reviewNoticeBanner: {
    backgroundColor: '#FBF5EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    padding: 14,
    marginTop: 14,
  },
  reviewNoticeText: {
    fontSize: 12,
    color: THEME.brandOrange,
    lineHeight: 18,
    fontWeight: '600',
  },
  submitRatingBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitRatingBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── History Screen Styles (Image 3) ──
  historyCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyCardDate: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
  },
  historyCardSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  historyCardScore: {
    fontSize: 16,
    fontWeight: '800',
  },
  historyTrendBanner: {
    backgroundColor: '#EAF7EE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  historyTrendBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#047857',
  },

  // ── Rating Record Screen Styles (Image 5) ──
  recordMetaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
  },
  recordMetaLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  recordMetaFarmName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 3,
    marginBottom: 14,
  },
  recordMetaGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  recordMetaVal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },

  // ── Permission Screen Styles ──
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  permissionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginTop: 18,
  },
  permissionCardDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  permissionBackBtn: {
    height: 44,
    paddingHorizontal: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBackBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },
});
