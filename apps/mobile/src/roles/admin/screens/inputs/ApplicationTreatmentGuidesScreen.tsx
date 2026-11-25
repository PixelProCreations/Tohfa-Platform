import React, { useState, useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  PlusIcon,
  SearchIcon,
  FilterSlidersIcon,
} from './inputsIcons';

export interface ApplicationTreatmentGuideItem {
  id: string;
  title: string;
  guideType: 'Input Application' | 'Pest Treatment';
  linkedItem: string;
  crops: string;
  status: 'Published' | 'Draft';
  version: string;
}

export type TreatmentGuideItem = ApplicationTreatmentGuideItem;

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
}: ApplicationTreatmentGuidesScreenProps): React.JSX.Element {
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
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
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
                <Text style={styles.guideMetaText}>
                  {item.guideType} · Linked: {item.linkedItem} · Crops: {item.crops}
                </Text>

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
    </View>
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
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  addCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
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
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  clearFilterText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
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
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 6,
  },
  guideTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: adminSpacing.md,
  },
  guideTitleText: {
    ...adminType.sectionHead,
    flex: 1,
    color: adminColors.ink,
    lineHeight: 19,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
    alignSelf: 'flex-start',
  },
  badgePublished: {
    backgroundColor: adminColors.success.bg,
  },
  badgeDraft: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeText: {
    ...adminType.caption,
  },
  badgeTextPublished: {
    color: adminColors.success.text,
  },
  badgeTextDraft: {
    color: adminColors.warning.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 18,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: adminColors.border,
  },
  actionText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  emptySubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 4,
  },
});
