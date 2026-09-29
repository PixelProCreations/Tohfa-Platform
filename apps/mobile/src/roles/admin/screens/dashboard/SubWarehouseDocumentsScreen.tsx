import React, { useState, useMemo } from 'react';
import {
  Alert,
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

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  // Status Badges
  activeBadgeBg: '#DCFCE7',
  activeBadgeText: '#15803D',
  
  expiringBadgeBg: '#FEF3C7',
  expiringBadgeBorder: '#FDE68A',
  expiringBadgeText: '#B45309',

  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
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

function LockBadgeIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 13, color = '#B45309' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

// ─── Document Data Model ─────────────────────────────────────────────────────

interface WarehouseDocItem {
  id: string;
  name: string;
  code: string;
  category: 'Registration' | 'Compliance' | 'License' | 'Other';
  status: 'Active' | 'Expiring Soon';
  dateNote: string;
}

const INITIAL_DOCS: WarehouseDocItem[] = [
  {
    id: '1',
    name: 'Warehouse Registration',
    code: 'DOC-00125',
    category: 'Registration',
    status: 'Active',
    dateNote: 'Issued 01 Jan 2026 · Expires 31 Dec 2026',
  },
  {
    id: '2',
    name: 'Compliance Document',
    code: 'DOC-00126',
    category: 'Compliance',
    status: 'Expiring Soon',
    dateNote: 'Expires 15 Oct 2026',
  },
  {
    id: '3',
    name: 'FSSAI Food Storage License',
    code: 'DOC-00127',
    category: 'License',
    status: 'Active',
    dateNote: 'Issued 15 Feb 2025 · Expires 14 Feb 2028',
  },
  {
    id: '4',
    name: 'Fire Safety Certificate',
    code: 'DOC-00128',
    category: 'Compliance',
    status: 'Active',
    dateNote: 'Valid till 30 Nov 2026',
  },
  {
    id: '5',
    name: 'Pollution Control Board NOC',
    code: 'DOC-00129',
    category: 'Compliance',
    status: 'Active',
    dateNote: 'Valid till 31 Dec 2027',
  },
  {
    id: '6',
    name: 'Municipal Trade License',
    code: 'DOC-00130',
    category: 'License',
    status: 'Active',
    dateNote: 'Issued 01 Apr 2025 · Expires 31 Mar 2027',
  },
  {
    id: '7',
    name: 'Commercial Property Insurance',
    code: 'DOC-00131',
    category: 'Other',
    status: 'Active',
    dateNote: 'Valid till 15 Aug 2027',
  },
  {
    id: '8',
    name: 'Weight & Measures Inspection',
    code: 'DOC-00132',
    category: 'Other',
    status: 'Active',
    dateNote: 'Verified 10 Jan 2026 · Valid 1 Year',
  },
];

type CategoryFilter = 'All' | 'Registration' | 'Compliance' | 'License' | 'Other';

export interface SubWarehouseDocumentsScreenProps {
  onBack: () => void;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

export function SubWarehouseDocumentsScreen({
  onBack,
  onTabChange,
}: SubWarehouseDocumentsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const totalCount = INITIAL_DOCS.length;
  const activeCount = INITIAL_DOCS.filter((d) => d.status === 'Active').length;
  const expiringSoonCount = INITIAL_DOCS.filter((d) => d.status === 'Expiring Soon').length;

  const filteredDocs = useMemo(() => {
    return INITIAL_DOCS.filter((doc) => {
      const matchCategory =
        selectedCategory === 'All' || doc.category === selectedCategory;
      const matchQuery =
        searchQuery.trim() === '' ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleDocPress = (doc: WarehouseDocItem) => {
    Alert.alert(
      doc.name,
      `Document ID: ${doc.code}\nCategory: ${doc.category}\nStatus: ${doc.status}\n${doc.dateNote}`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const categories: CategoryFilter[] = ['All', 'Registration', 'Compliance', 'License', 'Other'];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.985}
        bounces={true}
      >
        {/* ─── Top Brand Header (#F0562A) ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.75}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Warehouse Documents</Text>
          </View>
        </View>

        {/* ─── Main Content Container ─── */}
        <View style={styles.mainContainer}>
          {/* Subtitle Locked Warehouse */}
          <View style={styles.lockedSubtitleRow}>
            <LockBadgeIcon size={13} color="#59524C" />
            <Text style={styles.lockedSubtitleText}>Coonoor Warehouse</Text>
          </View>

          {/* 1. Stat Cards Row (3 Cards) */}
          <View style={styles.statsRow}>
            {/* Total */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL</Text>
              <Text style={styles.statValueTotal}>{totalCount}</Text>
            </View>

            {/* Active */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ACTIVE</Text>
              <Text style={styles.statValueActive}>{activeCount}</Text>
            </View>

            {/* Expiring Soon */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>EXPIRING SOON</Text>
              <Text style={styles.statValueExpiring}>{expiringSoonCount}</Text>
            </View>
          </View>

          {/* 2. Category Filter Chips */}
          <View style={styles.filterChipsWrap}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3. Search Bar */}
          <View style={styles.searchBarContainer}>
            <SearchIcon size={18} color={PALETTE.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Document name, ID, type"
              placeholderTextColor={PALETTE.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.searchFilterBtn}
              onPress={() => {
                Alert.alert('Filter', 'Filter options applied.');
              }}
              activeOpacity={0.7}
            >
              <FilterSlidersIcon size={18} color={PALETTE.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 4. Document List */}
          <View style={styles.docList}>
            {filteredDocs.map((doc) => {
              const isExpiring = doc.status === 'Expiring Soon';

              return (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.docCard}
                  onPress={() => handleDocPress(doc)}
                  activeOpacity={0.8}
                >
                  <View style={styles.docCardLeft}>
                    <Text style={styles.docTitle}>{doc.name}</Text>
                    <Text style={styles.docCode}>{doc.code}</Text>
                    <Text style={styles.docDate}>{doc.dateNote}</Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      isExpiring
                        ? styles.statusBadgeExpiring
                        : styles.statusBadgeActive,
                    ]}
                  >
                    {isExpiring && (
                      <WarningTriangleIcon size={12} color={PALETTE.expiringBadgeText} />
                    )}
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isExpiring
                          ? styles.statusBadgeTextExpiring
                          : styles.statusBadgeTextActive,
                      ]}
                    >
                      {doc.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredDocs.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateTitle}>No Documents Found</Text>
                <Text style={styles.emptyStateDesc}>
                  Try clearing your search query or selecting another category filter.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Home');
            else onBack();
          }}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Receiving');
          }}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Inventory');
          }}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('More');
          }}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // ─── Main Content Container ────────────────────────────────────────────────
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  lockedSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginLeft: 2,
  },
  lockedSubtitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#59524C',
  },

  // ─── Stats Row ─────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  statValueTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: PALETTE.textInk,
  },
  statValueActive: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16A34A',
  },
  statValueExpiring: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D97706',
  },

  // ─── Filter Chips Wrap ─────────────────────────────────────────────────────
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primarySoft,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  filterChipTextActive: {
    color: PALETTE.primaryDark,
    fontWeight: '800',
  },

  // ─── Search Bar ────────────────────────────────────────────────────────────
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  searchFilterBtn: {
    padding: 4,
  },

  // ─── Document List & Cards ─────────────────────────────────────────────────
  docList: {
    gap: 10,
  },
  docCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  docCardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  docCode: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  docDate: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },

  // ─── Status Badges ─────────────────────────────────────────────────────────
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusBadgeActive: {
    backgroundColor: PALETTE.activeBadgeBg,
  },
  statusBadgeExpiring: {
    backgroundColor: PALETTE.expiringBadgeBg,
    borderWidth: 1,
    borderColor: PALETTE.expiringBadgeBorder,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: PALETTE.activeBadgeText,
  },
  statusBadgeTextExpiring: {
    color: PALETTE.expiringBadgeText,
  },

  // ─── Empty State ───────────────────────────────────────────────────────────
  emptyStateContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginTop: 10,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  emptyStateDesc: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── Bottom Navigation Bar ─────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
