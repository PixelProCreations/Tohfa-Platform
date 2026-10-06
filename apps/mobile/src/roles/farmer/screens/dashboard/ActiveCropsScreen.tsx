import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import type { DiaryPlot } from '../../api/farmDiary';
import { listAllActiveFarmCrops, type FarmCropResponse } from '../../api/crops';
import type { CropItem } from '../farm/crops/ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emoji, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 16, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon({ size = 14, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LeafIcon({ size = 13, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 21 3c-1.5 4-2 5.5-3.1 11.2A7 7 0 0 1 11 20z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.5 13.5L14 10"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ClockMiniIcon({ size = 12, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 7v5l3 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckMiniIcon({ size = 12, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={P.twGreen100} />
      <Path
        d="M8 12l2.5 2.5L16 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & real-data mapping
// ─────────────────────────────────────────────

export interface ActiveCropData extends CropItem {
  progressPercent: number;
  stageName: string;
  estYield: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  /** Days to expected harvest, clamped to a large sentinel when unknown — used only for filtering. */
  filterDays: number;
}

/** Whole-day difference, `b - a`, ignoring time-of-day. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Maps a real farm_crops row (+ its plot) onto this screen's card shape.
 *
 * The backend has no growth-stage tracker (that's CropMilestonesScreen's
 * separate, out-of-scope concept — root task notes it has no backing
 * table), so `progressPercent`/`stageName` here are derived only from the
 * dates and status this API does provide, not a real stage model.
 *
 * Exported so the Dashboard's crop preview hands CropDetailScreen exactly the
 * payload this screen does.
 */
export function toActiveCropData(crop: FarmCropResponse, plot: DiaryPlot): ActiveCropData {
  const today = new Date();
  const plantedOn = crop.plantedOn ? new Date(crop.plantedOn) : null;
  const expectedHarvestOn = crop.expectedHarvestOn ? new Date(crop.expectedHarvestOn) : null;
  const daysOld = plantedOn ? Math.max(0, daysBetween(plantedOn, today)) : 0;
  const daysToHarvest = expectedHarvestOn ? daysBetween(today, expectedHarvestOn) : null;

  let progressPercent = 0;
  if (plantedOn && expectedHarvestOn) {
    const totalSpan = daysBetween(plantedOn, expectedHarvestOn);
    progressPercent = totalSpan > 0 ? Math.min(100, Math.max(0, Math.round((daysOld / totalSpan) * 100))) : 0;
  } else if (crop.status === 'GROWING') {
    // No planted/expected-harvest dates recorded to compute a real fraction from.
    progressPercent = 50;
  }

  const isHarvestSoon = daysToHarvest !== null && daysToHarvest <= 15;
  const accentColor = isHarvestSoon ? P.twOrange500 : crop.status === 'GROWING' ? colors.brandGreen : P.twBlue600;
  const badgeBg = isHarvestSoon ? P.twAmber50 : P.twGreen50;
  const badgeBorder = isHarvestSoon ? P.twAmber200 : P.twGreen100;
  const badgeText = isHarvestSoon ? P.twAmber800 : P.twGreen800;

  const statusText =
    daysToHarvest === null
      ? t(
          crop.status === 'PLANNED'
            ? 'farmer.crops.activeCrops.statusPlanned'
            : 'farmer.crops.activeCrops.statusGrowingNoDate',
        )
      : daysToHarvest < 0
        ? t('farmer.crops.activeCrops.statusOverdue', { days: Math.abs(daysToHarvest) })
        : t('farmer.crops.activeCrops.statusHarvestIn', { days: daysToHarvest });

  const stageName = t(
    crop.status === 'PLANNED' ? 'farmer.crops.status.planned' : 'farmer.crops.status.growing',
  );

  return {
    id: crop.id,
    name: crop.cropName,
    variety: crop.seedVariety ?? crop.cropName,
    cropType: 'custom',
    zone: plot.name,
    zoneShort: plot.name,
    area: plot.areaAcres !== null ? t('farmer.crops.activeCrops.areaAcres', { area: plot.areaAcres }) : '',
    daysOld,
    statusType: isHarvestSoon ? 'ready' : crop.status === 'GROWING' ? 'growing' : 'harvest',
    statusDays: daysToHarvest !== null && daysToHarvest > 0 ? daysToHarvest : 0,
    statusText,
    accentColor,
    progressPercent,
    stageName,
    estYield:
      crop.expectedYieldKg !== null
        ? t('farmer.crops.activeCrops.estYieldKg', { qty: crop.expectedYieldKg })
        : t('farmer.crops.activeCrops.estYieldUnknown'),
    badgeBg,
    badgeBorder,
    badgeText,
    filterDays: daysToHarvest === null ? Number.MAX_SAFE_INTEGER : Math.max(daysToHarvest, 0),
  };
}

type FilterTab = 'all' | 'harvest_soon' | 'growing';

export interface ActiveCropsScreenProps {
  onNavigateBack: () => void;
  onNavigateToCropDetail?: (crop: CropItem) => void;
  onNavigateToNewCrop?: () => void;
}

export function ActiveCropsScreen({
  onNavigateBack,
  onNavigateToCropDetail,
  onNavigateToNewCrop,
}: ActiveCropsScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [crops, setCrops] = useState<ActiveCropData[] | null>(null);
  const [plots, setPlots] = useState<DiaryPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // "All Active Crops" spans the whole farm, not one zone: every plot is
      // queried for GROWING and PLANNED crops with each cursor walked to the
      // end (shared with the Dashboard preview, so its count matches this list).
      const { plots: fetchedPlots, items } = await listAllActiveFarmCrops();
      setPlots(fetchedPlots);
      setCrops(items.map(({ crop, plot }) => toActiveCropData(crop, plot)));
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allCrops = crops ?? [];
  const harvestSoonCount = allCrops.filter((c) => c.filterDays <= 15).length;
  const growingCount = allCrops.length - harvestSoonCount;

  const filteredCrops = allCrops.filter((crop) => {
    if (activeFilter === 'harvest_soon') return crop.filterDays <= 15;
    if (activeFilter === 'growing') return crop.filterDays > 15;
    return true;
  });

  // Distinct plots backing at least one active crop, for the "Total Area" stat.
  const plotsWithActiveCrops = new Set(
    plots
      .filter((plot) => allCrops.some((c) => c.zone === plot.name))
      .map((plot) => plot.id),
  );
  const totalAreaAcres = plots
    .filter((plot) => plotsWithActiveCrops.has(plot.id) && plot.areaAcres !== null)
    .reduce((sum, plot) => sum + (plot.areaAcres ?? 0), 0);

  const nextHarvestDays = allCrops.reduce<number | null>((min, c) => {
    if (c.filterDays === Number.MAX_SAFE_INTEGER) return min;
    return min === null ? c.filterDays : Math.min(min, c.filterDays);
  }, null);

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={64} borderRadius={16} />
          <Skeleton width="100%" height={140} borderRadius={16} />
          <Skeleton width="100%" height={140} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, styles.errorContainer]}>
        <ErrorState error={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Sleek App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onNavigateBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>All Active Crops</Text>
            <Text style={styles.headerSubtitle}>
              {t('farmer.crops.activeCrops.countSubtitle', { count: allCrops.length })}
            </Text>
          </View>
        </View>

        {onNavigateToNewCrop && (
          <TouchableOpacity
            onPress={onNavigateToNewCrop}
            style={styles.addButton}
            activeOpacity={0.75}
            accessibilityLabel="Add new crop"
          >
            <PlusIcon size={13} color={P.white} />
            <Text style={styles.addButtonText}>Add Crop</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Summary Row */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{allCrops.length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {totalAreaAcres > 0 ? t('farmer.crops.activeCrops.areaAcres', { area: totalAreaAcres }) : '—'}
          </Text>
          <Text style={styles.summaryLabel}>Total Area</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: P.brandGreen }]}>
            {nextHarvestDays === null ? '—' : t('farmer.crops.activeCrops.nextHarvestDays', { days: nextHarvestDays })}
          </Text>
          <Text style={styles.summaryLabel}>Next Harvest</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'all' && styles.filterChipTextActive,
            ]}
          >
            All ({allCrops.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'harvest_soon' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('harvest_soon')}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'harvest_soon' && styles.filterChipTextActive,
            ]}
          >
            Harvest Ready ({harvestSoonCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'growing' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('growing')}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'growing' && styles.filterChipTextActive,
            ]}
          >
            Growing ({growingCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Crop Cards List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCrops.map((crop) => {
          const hasImgError = imageErrors[crop.id];
          return (
            <TouchableOpacity
              key={crop.id}
              style={styles.cropCard}
              activeOpacity={0.8}
              onPress={() => onNavigateToCropDetail?.(crop)}
            >
              {/* Card Top Row: Thumbnail + Identity + Status */}
              <View style={styles.cardHeader}>
                <View style={styles.imageWrapper}>
                  {!hasImgError && crop.imageUri ? (
                    <Image
                      source={{ uri: crop.imageUri }}
                      style={styles.cropImage}
                      resizeMode="cover"
                      onError={() => handleImageError(crop.id)}
                    />
                  ) : (
                    <View style={styles.imageFallback}>
                      <LeafIcon size={24} color={crop.accentColor} />
                    </View>
                  )}
                </View>

                <View style={styles.cropMeta}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <Text style={styles.cropSub}>
                    {crop.zoneShort} · {crop.variety}
                  </Text>
                  <Text style={styles.cropFootnote}>
                    Planted {crop.daysOld}d ago · {crop.area}
                  </Text>
                </View>

                <View style={styles.cardHeaderRight}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: crop.badgeBg,
                        borderColor: crop.badgeBorder,
                      },
                    ]}
                  >
                    <ClockMiniIcon size={11} color={crop.badgeText} />
                    <Text style={[styles.statusPillText, { color: crop.badgeText }]}>
                      {crop.statusText}
                    </Text>
                  </View>
                  <ChevronRightIcon size={15} color={P.twGray400} />
                </View>
              </View>

              {/* Card Mid: Growth Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <View style={styles.stageLabelGroup}>
                    <LeafIcon size={12} color={P.twGray500} />
                    <Text style={styles.stageLabelText}>{crop.stageName}</Text>
                  </View>
                  <Text style={styles.progressPercentText}>{crop.progressPercent}%</Text>
                </View>

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${crop.progressPercent}%`,
                        backgroundColor: crop.accentColor,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Card Bottom: Micro Metrics / Health */}
              <View style={styles.cardFooter}>
                <View style={styles.healthTag}>
                  <CheckMiniIcon size={12} color={P.twGreen700} />
                  <Text style={styles.healthText}>Est. Yield {crop.estYield}</Text>
                </View>
                <Text style={styles.viewDetailLink}>View Details →</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredCrops.length === 0 && (
          <View style={styles.emptyState}>
            <LeafIcon size={36} color={P.twGray400} />
            <Text style={styles.emptyStateTitle}>
              {allCrops.length === 0 ? t('farmer.crops.activeCrops.emptyTitle') : 'No crops in this view'}
            </Text>
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              style={styles.resetFilterBtn}
            >
              <Text style={styles.resetFilterBtnText}>Show All Active Crops</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  loadingContainer: {
    padding: 16,
    gap: 12,
  },
  errorContainer: {
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  headerTitleGroup: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.deepGreen,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.deepGreen,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: P.white,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  summaryLabel: {
    fontSize: typography.caption,
    color: P.twGray500,
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: P.twGray200,
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  filterChipActive: {
    backgroundColor: P.brandGreen,
    borderColor: P.brandGreen,
  },
  filterChipText: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray600,
  },
  filterChipTextActive: {
    color: P.white,
    fontWeight: '600',
  },

  // Scroll Content & Cards
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  cropCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGray100,
  },
  cropMeta: {
    flex: 1,
    marginLeft: 12,
  },
  cropName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  cropSub: {
    fontSize: typography.body,
    color: P.twGray600,
    marginTop: 1,
  },
  cropFootnote: {
    fontSize: typography.caption,
    color: P.twGray400,
    marginTop: 2,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },

  // Progress Section
  progressSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stageLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stageLabelText: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    fontWeight: '500',
  },
  progressPercentText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray700,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: P.twGray100,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  healthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  healthText: {
    fontSize: typography.caption,
    color: P.twGray500,
  },
  viewDetailLink: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.brandGreen,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 4,
  },
  resetFilterBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: P.twGreen50,
    borderWidth: 1,
    borderColor: P.twGreen100,
  },
  resetFilterBtnText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twGreen800,
  },
});
