import React, { useMemo, useRef, useState } from 'react';
import {
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
import Svg, {
  Path,
  Rect,
} from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="7" y="4" width="3" height="4" rx="1" fill={color} />
      <Rect x="14" y="10" width="3" height="4" rx="1" fill={color} />
      <Rect x="9" y="16" width="3" height="4" rx="1" fill={color} />
    </Svg>
  );
}

function SmallArrowLeftIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SmallArrowRightIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export type KnowledgeCategoryTab = 'Articles' | 'Videos' | 'Trainings' | 'Groups' | 'Communities';

export interface KnowledgeLibraryItem {
  id: string;
  title: string;
  typeBadge: 'Article' | 'Video' | 'Announcement' | 'Group Post' | 'Training';
  statusBadge: 'Draft' | 'Published' | 'Pending Review' | 'Active';
  subtitle: string;
  highlightBorder?: boolean;
}

const CATEGORY_TABS: KnowledgeCategoryTab[] = [
  'Articles',
  'Videos',
  'Trainings',
  'Groups',
  'Communities',
];

const INITIAL_ITEMS: KnowledgeLibraryItem[] = [
  {
    id: 'k-1',
    title: 'Tomato leaf curl management',
    typeBadge: 'Article',
    statusBadge: 'Draft',
    subtitle: 'Guide · Tomato · Expert verified · English · Demo TOHFA Admin',
  },
  {
    id: 'k-2',
    title: 'Tomato leaf curl management',
    typeBadge: 'Video',
    statusBadge: 'Published',
    subtitle: 'Guide · Tomato · Expert verified · English · Demo TOHFA Admin',
  },
  {
    id: 'k-3',
    title: 'Mulching for water retention',
    typeBadge: 'Article',
    statusBadge: 'Pending Review',
    subtitle: 'Article · General · Not crop-specific · English · Demo TOHFA Admin',
    highlightBorder: true,
  },
  {
    id: 'k-4',
    title: 'New fair-price ceiling for Q4',
    typeBadge: 'Announcement',
    statusBadge: 'Published',
    subtitle: 'Notice · All zones · English · Demo TOHFA Admin',
  },
  {
    id: 'k-5',
    title: 'Coonoor Organic Growers',
    typeBadge: 'Group Post',
    statusBadge: 'Active',
    subtitle: '42 members · Coonoor zone · Demo TOHFA Admin',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface KnowledgeLibraryScreenProps {
  onBack: () => void;
  onSelectItem?: (item: KnowledgeLibraryItem) => void;
  onNavigateAddVideo?: () => void;
  onNavigateCreateContent?: () => void;
}

export function KnowledgeLibraryScreen({
  onBack,
  onSelectItem,
}: KnowledgeLibraryScreenProps) {
  const [activeTab, setActiveTab] = useState<KnowledgeCategoryTab>('Articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const tabScrollRef = useRef<ScrollView>(null);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return INITIAL_ITEMS.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSub = item.subtitle.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSub) return false;
      }
      // Type Filter
      if (filterType !== 'All' && item.typeBadge !== filterType) {
        return false;
      }
      // Status Filter
      if (filterStatus !== 'All' && item.statusBadge !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [searchQuery, filterType, filterStatus]);

  const handleResetFilters = () => {
    setFilterType('All');
    setFilterStatus('All');
    setShowFilterModal(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshots 1 & 2) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Knowledge Library</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search & Filter Bar (Screenshots 1 & 2) ─── */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrap}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              (filterType !== 'All' || filterStatus !== 'All') && styles.filterBtnActive,
            ]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Filter knowledge items"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ─── Horizontal Tabs & Scroll Indicator (Screenshots 1 & 2) ─── */}
        <View style={styles.tabBarContainer}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabPill, isActive ? styles.tabPillActive : styles.tabPillInactive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabPillText, isActive ? styles.tabPillTextActive : styles.tabPillTextInactive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Progress / Scroll Indicator with arrows */}
          <View style={styles.tabScrollIndicatorRow}>
            <TouchableOpacity
              onPress={() => tabScrollRef.current?.scrollTo({ x: 0, animated: true })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SmallArrowLeftIcon size={12} color={adminColors.muted} />
            </TouchableOpacity>
            <View style={styles.tabScrollTrack}>
              <View
                style={[
                  styles.tabScrollThumb,
                  {
                    left:
                      activeTab === 'Articles'
                        ? '0%'
                        : activeTab === 'Videos'
                        ? '24%'
                        : activeTab === 'Trainings'
                        ? '48%'
                        : activeTab === 'Groups'
                        ? '70%'
                        : '85%',
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              onPress={() => tabScrollRef.current?.scrollToEnd({ animated: true })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SmallArrowRightIcon size={12} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Items Count Caption (Screenshots 1 & 2: "12 items") ─── */}
        <Text style={styles.countText}>12 items</Text>

        {/* ─── Cards List (Screenshots 1 & 2) ─── */}
        <View style={styles.cardsList}>
          {filteredItems.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  item.highlightBorder && styles.itemCardHighlighted,
                ]}
                onPress={() => onSelectItem && onSelectItem(item)}
                activeOpacity={0.7}
              >
                {/* Title & Status Badge Row */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      item.statusBadge === 'Published' && styles.publishedBadge,
                      item.statusBadge === 'Draft' && styles.draftBadge,
                      item.statusBadge === 'Pending Review' && styles.pendingBadge,
                      item.statusBadge === 'Active' && styles.activeBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.statusBadge === 'Published' && styles.publishedBadgeText,
                        item.statusBadge === 'Draft' && styles.draftBadgeText,
                        item.statusBadge === 'Pending Review' && styles.pendingBadgeText,
                        item.statusBadge === 'Active' && styles.activeBadgeText,
                      ]}
                    >
                      {item.statusBadge}
                    </Text>
                  </View>
                </View>

                {/* Type Badge Row */}
                <View style={styles.typeBadgeRow}>
                  <View
                    style={[
                      styles.typeBadge,
                      item.typeBadge === 'Article' && styles.articleBadge,
                      item.typeBadge === 'Video' && styles.videoBadge,
                      item.typeBadge === 'Announcement' && styles.announcementBadge,
                      item.typeBadge === 'Group Post' && styles.groupPostBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        item.typeBadge === 'Article' && styles.articleBadgeText,
                        item.typeBadge === 'Video' && styles.videoBadgeText,
                        item.typeBadge === 'Announcement' && styles.announcementBadgeText,
                        item.typeBadge === 'Group Post' && styles.groupPostBadgeText,
                      ]}
                    >
                      {item.typeBadge}
                    </Text>
                  </View>
                </View>

                {/* Subtitle */}
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ─── Suitable Filter Popup Modal ─── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Filter Knowledge Library</Text>

            {/* Type Filter */}
            <Text style={styles.filterSectionTitle}>Content Type</Text>
            <View style={styles.filterChipsRow}>
              {['All', 'Article', 'Video', 'Announcement', 'Group Post'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.filterChip, filterType === t && styles.filterChipActive]}
                  onPress={() => setFilterType(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Filter */}
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterChipsRow}>
              {['All', 'Published', 'Draft', 'Pending Review', 'Active'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
                  onPress={() => setFilterStatus(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet (Theme tokens compliant, zero raw hex/rgba) ───────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: 32,
  },

  // ─── Search and Filter Bar ───
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 14,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: adminColors.brandTint,
  },

  // ─── Tab Bar & Scroll Indicators ───
  tabBarContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  tabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: adminRadius.md,
  },
  tabPillActive: {
    backgroundColor: adminColors.brand,
  },
  tabPillInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabPillText: {
    fontSize: 13,
  },
  tabPillTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  tabPillTextInactive: {
    color: adminColors.ink,
    fontWeight: '600',
  },
  tabScrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  tabScrollTrack: {
    width: 140,
    height: 6,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  tabScrollThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 34,
    backgroundColor: adminColors.muted,
    borderRadius: adminRadius.full,
  },

  // ─── Count Text ───
  countText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  // ─── Cards List ───
  cardsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  itemCardHighlighted: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    ...adminType.rowTitle,
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  publishedBadge: {
    backgroundColor: adminColors.success.bg,
  },
  publishedBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },
  draftBadge: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  draftBadgeText: {
    color: adminColors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: adminColors.brandSoft.bg,
  },
  pendingBadgeText: {
    color: adminColors.brandSoft.text,
    fontSize: 11,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: adminColors.success.bg,
  },
  activeBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },

  // ─── Type Badges ───
  typeBadgeRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  articleBadge: {
    backgroundColor: adminColors.info.bg,
  },
  articleBadgeText: {
    color: adminColors.info.text,
    fontSize: 11,
    fontWeight: '700',
  },
  videoBadge: {
    backgroundColor: adminColors.purple.bg,
  },
  videoBadgeText: {
    color: adminColors.purple.text,
    fontSize: 11,
    fontWeight: '700',
  },
  announcementBadge: {
    backgroundColor: adminColors.warning.bg,
  },
  announcementBadgeText: {
    color: adminColors.warning.text,
    fontSize: 11,
    fontWeight: '700',
  },
  groupPostBadge: {
    backgroundColor: adminColors.success.bg,
  },
  groupPostBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },

  cardSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
  },

  // ─── Filter Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '92%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 12,
  },
  filterSectionTitle: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalResetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalApplyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
