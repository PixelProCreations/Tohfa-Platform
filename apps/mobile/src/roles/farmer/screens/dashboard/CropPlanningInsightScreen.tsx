import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import {
  getPlotRotationHistory,
  listCropMaster,
  type CropMasterResponse,
  type PlotRotationHistoryResponse,
} from '../../api/crops';
import {
  ACTIVE_CROP_STATUSES,
  daysBetween,
  loadFarmCropEntries,
  type FarmCropEntry,
} from '../farm/crops/cropItems';

/*
 * What this screen can and cannot show.
 *
 * The original design compared farm-wide SUPPLY against customer DEMAND per
 * crop ("Under-supplied / Balanced / Over-supplied", kg bars, "plant more /
 * switch crop" advice). No endpoint the farmer app can call exposes market
 * supply or customer demand -- only the farmer's own farm_crops, the
 * crop_master taxonomy, and per-plot rotation history. Those supply/demand
 * elements are therefore removed and replaced by a clearly-labelled
 * "not available yet" banner, rather than faked.
 *
 * Everything below is derived client-side from those three real sources:
 *   - "You grow this" / currently-on plots / expected yield: the farmer's
 *     PLANNED or GROWING farm_crops for that crop_master id.
 *   - In season / off season: crop_master.seasonMonths vs the current month
 *     (badge omitted when crop_master has no season data).
 *   - Past harvests / last harvested: the farmer's HARVESTED farm_crops.
 *   - Back-to-back signal: a plot whose two most recent rotation-history
 *     entries are the same crop.
 */

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={colors.brandGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LightbulbIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H15M12 3C8.68629 3 6 5.68629 6 9C6 11.2208 7.20683 13.1599 9 14.1973V17H15V14.1973C16.7932 13.1599 18 11.2208 18 9C18 5.68629 15.3137 3 12 3Z" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FarmerIcon = ({ color = P.twGreen700 }: { color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2.5" />
    <Path d="M4 21C4 17.134 7.13401 14 11 14H13C16.866 14 20 17.134 20 21" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const PlusCircleIcon = ({ color = P.twGreen700 }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SwitchIcon = ({ color = P.twOrange700 }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M7 16L3 12L7 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 8L21 12L17 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 12H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ── Types ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'youGrow' | 'inSeason';
const FILTERS: FilterType[] = ['all', 'youGrow', 'inSeason'];

type Signal = { kind: 'repeat'; plotName: string } | { kind: 'inSeasonNotGrown' };

interface CropInsight {
  cropMasterId: string;
  name: string;
  youGrow: boolean;
  /** null when crop_master has no seasonMonths for this crop. */
  inSeason: boolean | null;
  currentPlots: string[];
  /** Sum of expectedYieldKg over active plantings that recorded one; null if none did. */
  expectedYieldKg: number | null;
  pastHarvests: number;
  /** Days since the most recent actualHarvestOn; null if never harvested. */
  lastHarvestDaysAgo: number | null;
  signal: Signal | null;
}

function filterLabel(filter: FilterType): string {
  switch (filter) {
    case 'all':
      return t('farmer.crops.insight.filterAll');
    case 'youGrow':
      return t('farmer.crops.insight.filterYouGrow');
    case 'inSeason':
      return t('farmer.crops.insight.filterInSeason');
  }
}

// ── Derivation ───────────────────────────────────────────────────────────────

/**
 * Plots whose two most recent rotation entries are the same crop, keyed by
 * crop_master id. History is most-recent-first (crops.ts's
 * PlotRotationHistoryResponse); an entry is mapped to its crop_master id via
 * the farmer's own farm_crops rows (history carries only farmCropId/cropName).
 */
function repeatPlotsByCrop(
  histories: PlotRotationHistoryResponse[],
  entries: FarmCropEntry[],
): Map<string, string> {
  const byFarmCropId = new Map(entries.map((e) => [e.crop.id, e]));
  const result = new Map<string, string>();
  for (const history of histories) {
    const [latest, previous] = history.history;
    if (!latest || !previous) continue;
    const latestEntry = byFarmCropId.get(latest.farmCropId);
    const previousEntry = byFarmCropId.get(previous.farmCropId);
    if (!latestEntry || !previousEntry) continue;
    if (latestEntry.crop.cropMasterId !== previousEntry.crop.cropMasterId) continue;
    if (!result.has(latestEntry.crop.cropMasterId)) {
      result.set(latestEntry.crop.cropMasterId, latestEntry.plot.name);
    }
  }
  return result;
}

function buildInsights(
  cropMaster: CropMasterResponse[],
  entries: FarmCropEntry[],
  histories: PlotRotationHistoryResponse[],
  today: Date,
): CropInsight[] {
  const currentMonth = today.getMonth() + 1; // seasonMonths are 1-12
  const repeats = repeatPlotsByCrop(histories, entries);
  const insights: CropInsight[] = [];

  for (const master of cropMaster) {
    const mine = entries.filter((e) => e.crop.cropMasterId === master.id);
    const active = mine.filter((e) => ACTIVE_CROP_STATUSES.includes(e.crop.status));
    const harvested = mine.filter((e) => e.crop.status === 'HARVESTED');
    const inSeason = master.seasonMonths && master.seasonMonths.length > 0
      ? master.seasonMonths.includes(currentMonth)
      : null;

    // Only crops with something real to say: ones the farmer grows or has
    // grown, plus in-season crops (a planning option). Inactive taxonomy
    // entries are skipped unless the farmer has history with them.
    if (mine.length === 0 && !(master.isActive && inSeason === true)) continue;

    const yields = active
      .map((e) => e.crop.expectedYieldKg)
      .filter((kg): kg is number => kg !== null);
    const lastHarvest = harvested.reduce<Date | null>((latest, e) => {
      if (!e.crop.actualHarvestOn) return latest;
      const d = new Date(e.crop.actualHarvestOn);
      return !latest || d > latest ? d : latest;
    }, null);

    const repeatPlot = repeats.get(master.id);
    let signal: Signal | null = null;
    if (repeatPlot !== undefined) {
      signal = { kind: 'repeat', plotName: repeatPlot };
    } else if (inSeason === true && active.length === 0) {
      signal = { kind: 'inSeasonNotGrown' };
    }

    insights.push({
      cropMasterId: master.id,
      name: master.name,
      youGrow: active.length > 0,
      inSeason,
      currentPlots: Array.from(new Set(active.map((e) => e.plot.name))),
      expectedYieldKg: yields.length > 0 ? yields.reduce((sum, kg) => sum + kg, 0) : null,
      pastHarvests: harvested.length,
      lastHarvestDaysAgo: lastHarvest ? Math.max(0, daysBetween(lastHarvest, today)) : null,
      signal,
    });
  }

  // Crops you grow first, then in-season options, then the rest; by name within.
  const rank = (c: CropInsight) => (c.youGrow ? 0 : c.inSeason === true ? 1 : 2);
  return insights.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

// ── Component ────────────────────────────────────────────────────────────────

interface CropPlanningInsightScreenProps {
  onNavigateBack: () => void;
}

export function CropPlanningInsightScreen({ onNavigateBack }: CropPlanningInsightScreenProps): React.JSX.Element {
  const [filter, setFilter] = useState<FilterType>('all');
  const [insights, setInsights] = useState<CropInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ plots, entries }, cropMaster] = await Promise.all([
        loadFarmCropEntries(),
        listCropMaster(),
      ]);
      const histories = await Promise.all(plots.map((plot) => getPlotRotationHistory(plot.id)));
      setInsights(buildInsights(cropMaster, entries, histories, new Date()));
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredCrops = useMemo(() => {
    if (filter === 'youGrow') return insights.filter((c) => c.youGrow);
    if (filter === 'inSeason') return insights.filter((c) => c.inSeason === true);
    return insights;
  }, [filter, insights]);

  const renderCard = (crop: CropInsight) => (
    <View key={crop.cropMasterId} style={styles.cropCard}>
      {/* Card Header */}
      <View style={styles.cropCardHeader}>
        <Text style={styles.cropName}>{crop.name}</Text>
        {crop.youGrow && (
          <View style={styles.youGrowBadge}>
            <FarmerIcon color={P.twGreen700} />
            <Text style={styles.youGrowText}>{t('farmer.crops.insight.youGrowBadge')}</Text>
          </View>
        )}
        {crop.inSeason !== null && (
          <View style={[styles.statusBadge, crop.inSeason ? styles.statusBadgeIn : styles.statusBadgeOff]}>
            <Text style={[styles.statusBadgeText, crop.inSeason ? styles.statusBadgeTextIn : styles.statusBadgeTextOff]}>
              {t(crop.inSeason ? 'farmer.crops.insight.inSeason' : 'farmer.crops.insight.offSeason')}
            </Text>
          </View>
        )}
      </View>

      {/* Facts from the farmer's own records */}
      {crop.currentPlots.length > 0 && (
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>{t('farmer.crops.insight.currentlyOnLabel')}</Text>
          <Text style={styles.factValue}>{crop.currentPlots.join(', ')}</Text>
        </View>
      )}
      {crop.expectedYieldKg !== null && (
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>{t('farmer.crops.insight.expectedYieldLabel')}</Text>
          <Text style={styles.factValue}>
            {t('farmer.crops.activeCrops.estYieldKg', { qty: crop.expectedYieldKg })}
          </Text>
        </View>
      )}
      {crop.pastHarvests > 0 && (
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>{t('farmer.crops.insight.pastHarvestsLabel')}</Text>
          <Text style={styles.factValue}>{crop.pastHarvests}</Text>
        </View>
      )}
      {crop.lastHarvestDaysAgo !== null && (
        <View style={styles.factRow}>
          <Text style={styles.factLabel}>{t('farmer.crops.insight.lastHarvestLabel')}</Text>
          <Text style={styles.factValue}>
            {t('farmer.crops.insight.daysAgo', { days: crop.lastHarvestDaysAgo })}
          </Text>
        </View>
      )}

      {/* Derived planning signal */}
      {crop.signal && (
        <View
          style={[
            styles.insightCard,
            crop.signal.kind === 'repeat' ? styles.insightCardWarn : styles.insightCardOpportunity,
          ]}
        >
          <View style={styles.insightIconWrap}>
            {crop.signal.kind === 'repeat' ? (
              <SwitchIcon color={P.twAmber800} />
            ) : (
              <PlusCircleIcon color={P.twGreen700} />
            )}
          </View>
          <Text style={styles.insightText}>
            {crop.signal.kind === 'repeat'
              ? t('farmer.crops.insight.signalRepeat', { plot: crop.signal.plotName })
              : t('farmer.crops.insight.signalInSeasonNotGrown')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={72} borderRadius={12} />
          <Skeleton width="100%" height={140} borderRadius={14} />
          <Skeleton width="100%" height={140} borderRadius={14} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <ErrorState error={error} onRetry={load} />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Unavailable-data banner: supply vs. demand has no backing source */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <LightbulbIcon />
          </View>
          <View style={styles.infoBannerTextWrap}>
            <Text style={styles.bold}>{t('farmer.crops.insight.unavailableTitle')}</Text>
            <Text style={styles.infoBannerText}>{t('farmer.crops.insight.unavailableBody')}</Text>
          </View>
        </View>

        {insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('farmer.crops.insight.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('farmer.crops.insight.emptyBody')}</Text>
          </View>
        ) : (
          <>
            {/* Filter Pills */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterPill, filter === f && styles.filterPillActive]}
                  onPress={() => setFilter(f)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
                    {filterLabel(f)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredCrops.length === 0 ? (
              <Text style={styles.emptyBody}>{t('farmer.crops.insight.emptyFiltered')}</Text>
            ) : (
              filteredCrops.map(renderCard)
            )}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onNavigateBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.farmDiary.common.goBackLabel')}
        >
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{t('farmer.crops.insight.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.crops.insight.subtitle')}</Text>
        </View>
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.creamTint1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.weatherCloudWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.paleMintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: typography.body,
    fontWeight: '400',
    color: colors.textSubtle,
    marginTop: 1,
  },

  // Loading / error
  loadingContainer: {
    padding: 16,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: P.lightGreen,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.greenPaleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoBannerTextWrap: {
    flex: 1,
    gap: 4,
  },
  infoBannerText: {
    fontSize: typography.body,
    lineHeight: 19,
    color: P.greenDeep5,
  },
  bold: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textDark,
  },

  // Filter Pills
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterPillActive: {
    backgroundColor: colors.textDark,
    borderColor: colors.textDark,
  },
  filterPillText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray700,
  },
  filterPillTextActive: {
    color: P.weatherCloudWhite,
  },

  // Crop Card
  cropCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  cropName: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textDark,
  },
  youGrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P.twGreen100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youGrowText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twGreen700,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeIn: {
    backgroundColor: P.twGreen100,
  },
  statusBadgeOff: {
    backgroundColor: P.twGray100,
  },
  statusBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  statusBadgeTextIn: {
    color: P.twGreen700,
  },
  statusBadgeTextOff: {
    color: P.twGray700,
  },

  // Facts
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  factLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.textSubtle,
  },
  factValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textDark,
  },

  // Insight Card
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
    gap: 10,
  },
  insightCardWarn: {
    backgroundColor: P.twAmber50,
    borderColor: P.twAmber200,
  },
  insightCardOpportunity: {
    backgroundColor: P.twGreen50,
    borderColor: P.twEmerald100,
  },
  insightIconWrap: {
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: 19,
    color: P.twGray700,
  },

  // Empty
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: colors.textDark,
  },
  emptyBody: {
    fontSize: typography.body,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});
