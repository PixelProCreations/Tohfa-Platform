import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
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
import { useLearningArticles, useLearningGroups, useLearningTrainings, useLearningVideos } from '../../api/learningHooks';
import { useCommunities } from '../../api/communitiesHooks';
import { t } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import {
  articleRow,
  canManageLearning,
  groupLibraryRow,
  searchParam,
  totalText,
  trainingRow,
  videoRow,
  type LibraryRowView,
} from './communityLogic';
import { canModerateCommunities, communityRow } from './communitiesLogic';

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

const CATEGORY_TABS: KnowledgeCategoryTab[] = [
  'Articles',
  'Videos',
  'Trainings',
  'Groups',
  'Communities',
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface KnowledgeLibraryScreenProps {
  onBack: () => void;
  onSelectItem?: (item: LibraryRowView) => void;
  onNavigateAddVideo?: () => void;
  onNavigateCreateContent?: () => void;
  /** Opens a community from the Communities tab. */
  onSelectCommunity?: (communityId: string) => void;
  /** docs/rbac.json codes the signed-in admin holds; absent means no fetch. */
  can?: ((code: string) => boolean) | undefined;
}

/**
 * One tab per Learning Hub resource: articles, videos, trainings and groups
 * (GET /admin/learning/*, BR-59l/BR-59n). Only the open tab fetches.
 *
 * The fifth tab, Communities, reads GET /admin/communities (BR-59s), which needs
 * `community.group.moderate` rather than the learning permission; the content
 * type and status chips apply to the four content resources only.
 *
 * The item count is the server's `total` for the open tab, never a count of
 * the loaded rows. The type/status chips narrow what is already loaded; the
 * search box is the server's `q`.
 */
export function KnowledgeLibraryScreen({
  onBack,
  onSelectItem,
  onSelectCommunity,
  can,
}: KnowledgeLibraryScreenProps) {
  const [activeTab, setActiveTab] = useState<KnowledgeCategoryTab>('Articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const tabScrollRef = useRef<ScrollViewInstance>(null);

  const allowed = canManageLearning(can);
  const q = searchParam(searchQuery);
  const search = q === undefined ? {} : { q };

  const articles = useLearningArticles(search, { enabled: allowed && activeTab === 'Articles' });
  const videos = useLearningVideos(search, { enabled: allowed && activeTab === 'Videos' });
  const trainings = useLearningTrainings(search, { enabled: allowed && activeTab === 'Trainings' });
  const groups = useLearningGroups(search, { enabled: allowed && activeTab === 'Groups' });
  const communitiesAllowed = canModerateCommunities(can);
  const communities = useCommunities(search, { enabled: communitiesAllowed && activeTab === 'Communities' });

  const list =
    activeTab === 'Articles'
      ? articles
      : activeTab === 'Videos'
        ? videos
        : activeTab === 'Trainings'
          ? trainings
          : activeTab === 'Groups'
            ? groups
            : communities;

  const rows = useMemo((): LibraryRowView[] => {
    if (activeTab === 'Articles') return articles.items.map(articleRow);
    if (activeTab === 'Videos') return videos.items.map(videoRow);
    if (activeTab === 'Trainings') return trainings.items.map(trainingRow);
    if (activeTab === 'Groups') return groups.items.map(groupLibraryRow);
    return [];
  }, [activeTab, articles.items, videos.items, trainings.items, groups.items]);

  const filteredItems = useMemo(
    () =>
      rows.filter((row) => {
        if (filterType !== 'All' && row.typeBadge !== filterType) return false;
        // Compare the canonical status, not its translated label.
        if (filterStatus !== 'All' && row.status !== filterStatus) return false;
        return true;
      }),
    [rows, filterType, filterStatus],
  );

  const isCommunitiesTab = activeTab === 'Communities';
  const communityRows = useMemo(() => communities.items.map((dto, index) => communityRow(dto, index)), [communities.items]);
  const tabAllowed = isCommunitiesTab ? communitiesAllowed : allowed;
  const viewState = queryViewState({
    isLoading: list.isLoading,
    error: list.error,
    itemCount: isCommunitiesTab ? communityRows.length : filteredItems.length,
  });

  const handleResetFilters = () => {
    setFilterType('All');
    setFilterStatus('All');
    setShowFilterModal(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
        <Text style={styles.countText} testID="community.library.count">
          {t('community.library.count', { total: totalText(list.total) })}
        </Text>

        {/* ─── Cards List (Screenshots 1 & 2) ─── */}
        {!tabAllowed ? (
          <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
        ) : viewState === 'loading' ? (
          <AdminLoadingState />
        ) : viewState === 'error' ? (
          <AdminErrorState error={list.error} onRetry={list.refresh} />
        ) : viewState === 'empty' ? (
          <AdminEmptyState title={t(isCommunitiesTab ? 'community.empty.communities' : 'community.empty.library')} />
        ) : isCommunitiesTab ? (
          <View style={styles.cardsList}>
            {communityRows.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={styles.itemCard}
                onPress={() => onSelectCommunity?.(row.id)}
                activeOpacity={0.7}
                testID={`community.library.community.${row.id}`}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <View style={[styles.statusBadge, row.status === 'Active' && styles.activeBadge]}>
                    <Text style={[styles.statusBadgeText, row.status === 'Active' && styles.activeBadgeText]}>{row.statusText}</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {row.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
            {list.hasMore ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={list.loadMore} activeOpacity={0.8}>
                <Text style={styles.loadMoreBtnText}>{t('community.loadMore')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
        <View style={styles.cardsList}>
          {filteredItems.map((item) => {
            return (
              <TouchableOpacity
                key={`${item.kind}:${item.id}`}
                style={styles.itemCard}
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
                      item.status === 'Published' && styles.publishedBadge,
                      item.status === 'Draft' && styles.draftBadge,
                      item.status === 'Active' && styles.activeBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'Published' && styles.publishedBadgeText,
                        item.status === 'Draft' && styles.draftBadgeText,
                        item.status === 'Active' && styles.activeBadgeText,
                      ]}
                    >
                      {item.statusText}
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
                      item.typeBadge === 'Group Post' && styles.groupPostBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        item.typeBadge === 'Article' && styles.articleBadgeText,
                        item.typeBadge === 'Video' && styles.videoBadgeText,
                        item.typeBadge === 'Group Post' && styles.groupPostBadgeText,
                      ]}
                    >
                      {item.typeBadge}
                    </Text>
                  </View>
                </View>

                {/* Subtitle: the designed meta line. Its crop and expert-verification
                    slots have no field in the spec, so they carry the dash. */}
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            );
          })}
          {list.hasMore ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={list.loadMore} activeOpacity={0.8}>
              <Text style={styles.loadMoreBtnText}>{t('community.loadMore')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        )}
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
              {/* The spec has four content types. "Announcement" is not one of
                  them, so it is not offered as a filter that can never match. */}
              {['All', 'Article', 'Video', 'Training', 'Group Post'].map((t) => (
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
              {/* isPublished (articles/videos/trainings) and isArchived (groups)
                  are the only states these resources have; there is no review
                  state anywhere in the spec. */}
              {['All', 'Published', 'Draft', 'Active', 'Archived'].map((s) => (
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
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  loadMoreBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
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
