import React, { useState, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function PlusIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Data Interface & Mock Records ───────────────────────────────────────────

export interface ApplicationTreatmentGuideItem {
  id: string;
  title: string;
  guideType: 'Input Application' | 'Pest Treatment';
  linkedItem: string;
  crops: string;
  status: 'Published' | 'Draft';
  version: string;
}

export const INITIAL_TREATMENT_GUIDES: ApplicationTreatmentGuideItem[] = [
  {
    id: 'g-1',
    title: 'Neem Oil — Foliar Spray Guide',
    guideType: 'Input Application',
    linkedItem: 'Neem Oil Concentrate',
    crops: 'Tomato, Cabbage',
    status: 'Published',
    version: 'Published v2',
  },
  {
    id: 'g-2',
    title: 'Late Blight — Organic Treatment',
    guideType: 'Pest Treatment',
    linkedItem: 'Late Blight',
    crops: 'Tomato, Potato',
    status: 'Draft',
    version: 'Draft',
  },
  {
    id: 'g-3',
    title: 'Panchagavya — Soil Application Guide',
    guideType: 'Input Application',
    linkedItem: 'Panchagavya Mix',
    crops: 'Carrot, Beans',
    status: 'Published',
    version: 'Published v1',
  },
  {
    id: 'g-4',
    title: 'Fruit Borer — Pheromone Trap Guide',
    guideType: 'Pest Treatment',
    linkedItem: 'Fruit Borer',
    crops: 'Tomato, Brinjal',
    status: 'Published',
    version: 'Published v3',
  },
  {
    id: 'g-5',
    title: 'Trichoderma Seed & Root Treatment',
    guideType: 'Input Application',
    linkedItem: 'Trichoderma Viride',
    crops: 'All Vegetable Crops',
    status: 'Draft',
    version: 'Draft',
  },
  {
    id: 'g-6',
    title: 'Baking Soda & Sulfur Spray Guide',
    guideType: 'Pest Treatment',
    linkedItem: 'Powdery Mildew',
    crops: 'Pea, Cucurbits',
    status: 'Published',
    version: 'Published v1',
  },
  {
    id: 'g-7',
    title: 'Bio-NPK Liquid Fertigation Guide',
    guideType: 'Input Application',
    linkedItem: 'Bio-NPK Liquid',
    crops: 'Tomato, Carrot, Potato',
    status: 'Draft',
    version: 'Draft',
  },
  {
    id: 'g-8',
    title: 'Aphid Bio-Control with Verticillium',
    guideType: 'Pest Treatment',
    linkedItem: 'Aphid',
    crops: 'Carrot, Cabbage',
    status: 'Published',
    version: 'Published v2',
  },
  {
    id: 'g-9',
    title: 'Pseudomonas Drenching Schedule',
    guideType: 'Input Application',
    linkedItem: 'Pseudomonas Fluorescens',
    crops: 'Ginger, Turmeric, Tomato',
    status: 'Published',
    version: 'Published v1',
  },
];

export interface ApplicationTreatmentGuidesScreenProps {
  onBack: () => void;
  onAddNewGuide: () => void;
  onSelectGuide?: (guide: ApplicationTreatmentGuideItem) => void;
  onEditGuide?: (guide: ApplicationTreatmentGuideItem) => void;
}

export function ApplicationTreatmentGuidesScreen({
  onBack,
  onAddNewGuide,
  onSelectGuide,
  onEditGuide,
}: ApplicationTreatmentGuidesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
  const [guides] = useState<ApplicationTreatmentGuideItem[]>(INITIAL_TREATMENT_GUIDES);

  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          g.title.toLowerCase().includes(q) ||
          g.linkedItem.toLowerCase().includes(q) ||
          g.crops.toLowerCase().includes(q) ||
          g.guideType.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (statusFilter !== 'All' && g.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [guides, searchQuery, statusFilter]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner (Matching Image 2) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Application & Treatment Guides</Text>
            <Text style={styles.headerSubtitle}>9 guides · Input and pest treatment</Text>
          </View>

          <TouchableOpacity
            style={styles.addCircleBtn}
            onPress={onAddNewGuide}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add New Guide"
          >
            <PlusIcon size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconWrap}>
            <SearchIcon />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              setStatusFilter((prev) =>
                prev === 'All' ? 'Published' : prev === 'Published' ? 'Draft' : 'All'
              );
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Toggle filter"
          >
            <FilterSlidersIcon />
          </TouchableOpacity>
        </View>

        {/* Records Count Line */}
        <View style={styles.countRow}>
          <Text style={styles.recordsCountText}>
            {filteredGuides.length} record{filteredGuides.length === 1 ? '' : 's'}
          </Text>
          {statusFilter !== 'All' && (
            <TouchableOpacity onPress={() => setStatusFilter('All')} activeOpacity={0.7}>
              <Text style={styles.clearFilterText}>Filter: {statusFilter} (Clear)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Guides List */}
        <View style={styles.cardsList}>
          {filteredGuides.map((item) => {
            const isPublished = item.status === 'Published';
            return (
              <View key={item.id} style={styles.guideCard}>
                {/* Meta info: Type · Linked item · Crops */}
                <Text style={styles.guideMetaText}>
                  {item.guideType} · Linked: {item.linkedItem} · Crops: {item.crops}
                </Text>

                {/* Title & Badge Row */}
                <View style={styles.guideTitleRow}>
                  <Text style={styles.guideTitleText}>{item.title}</Text>
                  <View
                    style={[
                      styles.badgePill,
                      isPublished ? styles.badgePublished : styles.badgeDraft,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isPublished ? styles.badgeTextPublished : styles.badgeTextDraft,
                      ]}
                    >
                      {item.version}
                    </Text>
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      if (onSelectGuide) {
                        onSelectGuide(item);
                      } else {
                        Alert.alert(item.title, `Viewing guide details for ${item.linkedItem}.`);
                      }
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Version History',
                        `${item.title}\n\nCurrent: ${item.version}\nPrevious: v1.0 created on 10 Oct 2026\nUpdated by Agronomy team.`
                      );
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.actionText}>Version History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (onEditGuide) {
                        onEditGuide(item);
                      } else {
                        onAddNewGuide();
                      }
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {filteredGuides.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No application guides found</Text>
            <Text style={styles.emptySubtitle}>Try searching for another crop, pest or input name.</Text>
          </View>
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 8,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
    marginRight: adminSpacing.xs,
  },
  headerTextGroup: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  addCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: adminSpacing.xs,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchIconWrap: {
    marginRight: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 6,
    marginLeft: adminSpacing.xs,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },
  recordsCountText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    fontWeight: '600',
  },
  clearFilterText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.brand,
    fontWeight: '700',
  },
  cardsList: {
    rowGap: 12,
  },
  guideCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  guideMetaText: {
    fontSize: 10.5,
    color: '#8A827B',
    marginBottom: 6,
    fontWeight: '500',
  },
  guideTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: adminSpacing.md,
  },
  guideTitleText: {
    ...adminType.rowTitle,
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
    lineHeight: 19,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgePublished: {
    backgroundColor: '#E8F5E9',
  },
  badgeDraft: {
    backgroundColor: '#FFF8E1',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeTextPublished: {
    color: '#2E7D32',
  },
  badgeTextDraft: {
    color: '#B78103',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 18,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0ECE8',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5835',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 15,
  },
  emptySubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
  },
});

