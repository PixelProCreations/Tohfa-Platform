import React, { useMemo, useState } from 'react';
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
  ClipPath,
  Defs,
  G,
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

function PlusIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}

/** Rich Tea Plantation / Green Hills Landscape Thumbnail matching screenshots */
function MountainLandscapeThumbnail({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <ClipPath id="commThumbClip">
          <Rect width="64" height="64" rx="10" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#commThumbClip)">
        {/* Sky */}
        <Rect width="64" height="64" fill={adminColors.info.bg} />
        {/* Distant Hills */}
        <Path d="M-6 36 Q 16 20, 32 30 T 70 24 L 70 64 L -6 64 Z" fill={adminColors.purple.bg} opacity="0.6" />
        {/* Mid Hills */}
        <Path d="M-4 42 Q 18 30, 40 36 T 68 32 L 68 64 L -4 64 Z" fill={adminColors.success.border} opacity="0.5" />
        {/* Foreground Lush Green Mountain Rows */}
        <Path d="M-2 48 Q 16 38, 34 44 T 66 40 L 66 64 L -2 64 Z" fill={adminColors.success.text} opacity="0.85" />
        <Path d="M0 52 Q 22 46, 46 50 L 64 48 L 64 64 L 0 64 Z" fill={adminColors.success.text} />
        {/* Plantation contour lines */}
        <Path d="M4 51 Q 22 45, 42 49" stroke={adminColors.card} strokeWidth="0.8" opacity="0.4" fill="none" />
        <Path d="M6 55 Q 26 49, 52 53" stroke={adminColors.card} strokeWidth="0.8" opacity="0.4" fill="none" />
      </G>
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface CommunityListItem {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  discoverability: 'Discoverable' | 'Hidden';
  membership: 'Open' | 'Invitation-only';
  membersCount: number;
  archivedDate?: string;
  thumbnailType: 'landscape' | 'ochre' | 'slate';
}

const INITIAL_COMMUNITIES: CommunityListItem[] = [
  {
    id: 'comm-1',
    name: 'Nilgiris Organic Growers (demo)',
    status: 'Active',
    discoverability: 'Discoverable',
    membership: 'Open',
    membersCount: 142,
    thumbnailType: 'landscape',
  },
  {
    id: 'comm-2',
    name: 'Coonoor Spice Collective (demo)',
    status: 'Active',
    discoverability: 'Discoverable',
    membership: 'Invitation-only',
    membersCount: 58,
    thumbnailType: 'ochre',
  },
  {
    id: 'comm-3',
    name: 'Kotagiri Tea Farmers (demo)',
    status: 'Archived',
    discoverability: 'Hidden',
    membership: 'Open',
    membersCount: 31,
    archivedDate: '1 Sep 2026',
    thumbnailType: 'slate',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CommunitiesListScreenProps {
  onBack: () => void;
  onSelectCommunity?: (communityId: string) => void;
  onNavigateCreateCommunity?: () => void;
}

export function CommunitiesListScreen({
  onBack,
  onSelectCommunity,
  onNavigateCreateCommunity,
}: CommunitiesListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter States
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Archived'>('All');
  const [filterMembership, setFilterMembership] = useState<'All' | 'Open' | 'Invitation-only'>('All');
  const [filterDiscoverability, setFilterDiscoverability] = useState<'All' | 'Discoverable' | 'Hidden'>('All');

  // Filtered List
  const filteredCommunities = useMemo(() => {
    return INITIAL_COMMUNITIES.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesType = item.membership.toLowerCase().includes(query);
        if (!matchesName && !matchesType) return false;
      }
      // Status
      if (filterStatus !== 'All' && item.status !== filterStatus) {
        return false;
      }
      // Membership
      if (filterMembership !== 'All' && item.membership !== filterMembership) {
        return false;
      }
      // Discoverability
      if (filterDiscoverability !== 'All' && item.discoverability !== filterDiscoverability) {
        return false;
      }
      return true;
    });
  }, [searchQuery, filterStatus, filterMembership, filterDiscoverability]);

  const activeCount = useMemo(() => {
    return INITIAL_COMMUNITIES.filter((c) => c.status === 'Active').length;
  }, []);

  const handleResetFilters = () => {
    setFilterStatus('All');
    setFilterMembership('All');
    setFilterDiscoverability('All');
    setShowFilterModal(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 1) ─── */}
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
            <Text style={styles.headerTitle}>Communities</Text>
          </View>

          {onNavigateCreateCommunity && (
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={onNavigateCreateCommunity}
              activeOpacity={0.8}
              accessibilityLabel="Create community"
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
        {/* ─── Search and Filter Bar (Screenshot 1) ─── */}
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
              (filterStatus !== 'All' || filterMembership !== 'All' || filterDiscoverability !== 'All') && styles.filterBtnActive,
            ]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Filter communities"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ─── Communities Count Caption (Screenshot 1: "5 communities (4 active)") ─── */}
        <Text style={styles.countText}>
          {INITIAL_COMMUNITIES.length} communities ({activeCount} active)
        </Text>

        {/* ─── Community Cards List (Screenshot 1) ─── */}
        <View style={styles.cardsList}>
          {filteredCommunities.map((item) => {
            const isItemArchived = item.status === 'Archived';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.communityCard}
                onPress={() => onSelectCommunity && onSelectCommunity(item.id)}
                activeOpacity={0.7}
              >
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                  {item.thumbnailType === 'landscape' ? (
                    <MountainLandscapeThumbnail size={64} />
                  ) : item.thumbnailType === 'ochre' ? (
                    <View style={styles.ochreThumbnail} />
                  ) : (
                    <View style={styles.slateThumbnail} />
                  )}
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
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
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {isItemArchived
                      ? `Hidden · Archived ${item.archivedDate || '1 Sep 2026'} · ${item.membersCount} members`
                      : `${item.discoverability} · ${item.membership} · ${item.membersCount} members`}
                  </Text>
                </View>
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
            <Text style={styles.modalTitle}>Filter Communities</Text>

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

            {/* Membership Filter */}
            <Text style={styles.filterSectionTitle}>Membership</Text>
            <View style={styles.filterChipsRow}>
              {(['All', 'Open', 'Invitation-only'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.filterChip, filterMembership === m && styles.filterChipActive]}
                  onPress={() => setFilterMembership(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, filterMembership === m && styles.filterChipTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Discoverability Filter */}
            <Text style={styles.filterSectionTitle}>Discoverability</Text>
            <View style={styles.filterChipsRow}>
              {(['All', 'Discoverable', 'Hidden'] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, filterDiscoverability === d && styles.filterChipActive]}
                  onPress={() => setFilterDiscoverability(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, filterDiscoverability === d && styles.filterChipTextActive]}>
                    {d}
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
    backgroundColor: adminColors.headerIcon.bg,
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

  // ─── Cards List ───
  cardsList: {
    gap: 12,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  thumbnailContainer: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
  },
  ochreThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: adminColors.warning.border,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  slateThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: adminColors.info.border,
    borderWidth: 1,
    borderColor: adminColors.border,
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
});
