import React, { useMemo, useState } from 'react';
import {
  Modal,
ScrollView,
StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, {
  Circle,
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
import { useLearningGroups } from '../../api/learningHooks';
import { t } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import { canManageLearning, groupSortParam, matchesStatusFilter, searchParam, toGroupRow, totalText } from './communityLogic';

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

function PlusIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}


function ThreeDotsVerticalIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
    </Svg>
  );
}

function EyeIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilEditIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusMiniIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface GroupsListScreenProps {
  onBack: () => void;
  onSelectGroup?: (groupId: string) => void;
  onNavigateCreateGroup?: () => void;
  onNavigateEditGroup?: (groupId?: string) => void;
  onNavigateCreatePost?: (groupId?: string) => void;
  /** docs/rbac.json codes the signed-in admin holds; absent means no fetch. */
  can?: ((code: string) => boolean) | undefined;
}

/**
 * GET /admin/learning/groups (BR-59n). The server sorts and searches; the
 * archived/active chip has no server filter, so it narrows the loaded rows.
 *
 * The design's "Community" filter and the community line under each group name
 * have no field on the wire — there is no community resource — so the chip row
 * keeps only "All" and the subtitle carries the dash.
 */
export function GroupsListScreen({
  onBack,
  onSelectGroup,
  onNavigateCreateGroup,
  onNavigateEditGroup,
  onNavigateCreatePost,
  can,
}: GroupsListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeMenuGroupId, setActiveMenuGroupId] = useState<string | null>(null);

  // Filter States
  const [filterCommunity, setFilterCommunity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Archived'>('All');
  const [sortBy, setSortBy] = useState<'farmers' | 'alphabetical'>('farmers');

  const allowed = canManageLearning(can);
  const q = searchParam(searchQuery);
  const list = useLearningGroups({ ...(q === undefined ? {} : { q }), sort: groupSortParam(sortBy) }, { enabled: allowed });

  const rows = useMemo(() => list.items.map((dto, index) => toGroupRow(dto, index)), [list.items]);
  const filteredGroups = useMemo(() => rows.filter((row) => matchesStatusFilter(row.status, filterStatus)), [rows, filterStatus]);

  const viewState = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: filteredGroups.length });

  const handleResetFilters = () => {
    setFilterCommunity('All');
    setFilterStatus('All');
    setSortBy('farmers');
    setShowFilterModal(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 2) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon size={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Groups</Text>
          </View>

          {onNavigateCreateGroup && (
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={onNavigateCreateGroup}
              activeOpacity={0.8}
              accessibilityLabel="Create group"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <PlusIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search and Filter Bar (Screenshot 2) ─── */}
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
              (filterCommunity !== 'All' || filterStatus !== 'All') && styles.filterBtnActive,
            ]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Filter groups"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ─── Count Caption (Screenshot 2: "7 groups") ─── */}
        <Text style={styles.countText} testID="community.groups.count">
          {t('community.groups.count', { total: totalText(list.total) })}
        </Text>

        {/* ─── Group Cards List (Screenshot 2) ─── */}
        {!allowed ? (
          <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
        ) : viewState === 'loading' ? (
          <AdminLoadingState />
        ) : viewState === 'error' ? (
          <AdminErrorState error={list.error} onRetry={list.refresh} />
        ) : viewState === 'empty' ? (
          <AdminEmptyState title={t('community.empty.groups')} />
        ) : (
        <View style={styles.cardsList}>
          {filteredGroups.map((group) => {
            const isItemArchived = group.status === 'Archived';
            return (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => onSelectGroup && onSelectGroup(group.id)}
                activeOpacity={0.7}
              >
                {/* Solid Thumbnail Swatch matching screenshot colors */}
                <View
                  style={[
                    styles.thumbnail,
                    group.swatch === 'ochre' && styles.ochreThumbnail,
                    group.swatch === 'sage' && styles.sageThumbnail,
                    group.swatch === 'purple' && styles.purpleThumbnail,
                    group.swatch === 'brand' && styles.brandThumbnail,
                    group.swatch === 'info' && styles.infoThumbnail,
                  ]}
                />

                {/* Content */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {group.name}
                    </Text>
                    <View style={styles.cardHeaderRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          isItemArchived ? styles.archivedBadge : styles.activeBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isItemArchived ? styles.archivedBadgeText : styles.activeBadgeText,
                          ]}
                        >
                          {group.statusText}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.threeDotsBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setActiveMenuGroupId(group.id);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Group actions"
                      >
                        <ThreeDotsVerticalIcon size={16} color={adminColors.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* community · N farmers — the community half has no endpoint, so it is the dash. */}
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {group.subtitle}
                  </Text>
                </View>
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
            <Text style={styles.modalTitle}>Filter Groups</Text>

            {/* Community Filter: there is no community resource, so "All" is
                the only option the server can honour. */}
            <Text style={styles.filterSectionTitle}>Community</Text>
            <View style={styles.filterChipsRow}>
              {['All'].map((comm) => (
                <TouchableOpacity
                  key={comm}
                  style={[styles.filterChip, filterCommunity === comm && styles.filterChipActive]}
                  onPress={() => setFilterCommunity(comm)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, filterCommunity === comm && styles.filterChipTextActive]}>
                    {comm}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Filter */}
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterChipsRow}>
              {(['All', 'Active', 'Archived'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
                  onPress={() => setFilterStatus(st)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, filterStatus === st && styles.filterChipTextActive]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort Order */}
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterChipsRow}>
              <TouchableOpacity
                style={[styles.filterChip, sortBy === 'farmers' && styles.filterChipActive]}
                onPress={() => setSortBy('farmers')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, sortBy === 'farmers' && styles.filterChipTextActive]}>
                  Most farmers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, sortBy === 'alphabetical' && styles.filterChipActive]}
                onPress={() => setSortBy('alphabetical')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, sortBy === 'alphabetical' && styles.filterChipTextActive]}>
                  Alphabetical
                </Text>
              </TouchableOpacity>
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
      {/* ─── Group Actions Dropdown Popup Menu ─── */}
      <Modal
        visible={activeMenuGroupId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMenuGroupId(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setActiveMenuGroupId(null)}
        >
          <View style={styles.menuPopupCard}>
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                const id = activeMenuGroupId;
                setActiveMenuGroupId(null);
                if (id && onSelectGroup) onSelectGroup(id);
              }}
              activeOpacity={0.7}
            >
              <EyeIcon size={16} color={adminColors.ink} />
              <Text style={styles.menuItemText}>View Details</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                const id = activeMenuGroupId;
                setActiveMenuGroupId(null);
                if (onNavigateEditGroup) onNavigateEditGroup(id || undefined);
                else if (onNavigateCreateGroup) onNavigateCreateGroup();
              }}
              activeOpacity={0.7}
            >
              <PencilEditIcon size={16} color={adminColors.ink} />
              <Text style={styles.menuItemText}>Edit group</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                const id = activeMenuGroupId;
                setActiveMenuGroupId(null);
                if (onNavigateCreatePost) onNavigateCreatePost(id || undefined);
              }}
              activeOpacity={0.7}
            >
              <PlusMiniIcon size={16} color={adminColors.ink} />
              <Text style={styles.menuItemText}>Create post</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
  },
  headerLeft: {
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
  headerAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Scroll View ───
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

  // ─── Count Text ───
  countText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  // ─── Group Cards List ───
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
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  ochreThumbnail: {
    backgroundColor: adminColors.warning.border,
  },
  sageThumbnail: {
    backgroundColor: adminColors.success.border,
  },
  purpleThumbnail: {
    backgroundColor: adminColors.purple.border,
  },
  brandThumbnail: {
    backgroundColor: adminColors.brandTint,
  },
  infoThumbnail: {
    backgroundColor: adminColors.info.bg,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitleRow: {
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
  activeBadge: {
    backgroundColor: adminColors.success.bg,
  },
  archivedBadge: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeBadgeText: {
    color: adminColors.success.text,
  },
  archivedBadgeText: {
    color: adminColors.muted,
  },
  cardSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 4,
  },

  // ─── Modal Filter ───
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
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  threeDotsBtn: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuPopupCard: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    width: 220,
    ...adminShadow.md,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: adminColors.border,
    marginHorizontal: 12,
  },
});
