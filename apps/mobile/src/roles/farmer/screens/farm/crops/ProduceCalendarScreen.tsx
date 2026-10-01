import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P, typography } from '../../../theme';
import type { DiaryPlot } from '../../../api/farmDiary';
import {
  ACTIVE_CROP_STATUSES,
  loadFarmCropEntries,
  type CropIllustrationType,
  type CropItem,
  type FarmCropEntry,
} from './cropItems';

// `CropItem` moved to ./cropItems (it is now built from real farm_crops rows);
// re-exported here so the many screens that import the type from this file
// keep compiling unchanged.
export type { CropItem } from './cropItems';

/**
 * Width of the "Harvest soon" filter bucket. Purely a presentational grouping
 * on this screen (the same window the original design used), not a business
 * rule -- nothing is enforced or charged against it.
 */
const HARVEST_SOON_WINDOW_DAYS = 30;

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

function ChevronDownIcon({ size = 16, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
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

function ClockMiniIcon({ size = 13, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7v5l3 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarMiniIcon({ size = 13, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="7" y="14" width="3" height="3" rx="0.5" fill={color} />
      <Rect x="14" y="14" width="3" height="3" rx="0.5" fill={color} />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Crop Illustrations (rendered offline; picked from the crop's real name)
// ─────────────────────────────────────────────

function CarrotIllustration({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.illustrationContainer, { width: size, height: size, backgroundColor: P.twOrange100 }]}>
      <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 32 32" fill="none">
        <Path d="M16 6c-1-3-3-4-5-5 0 2 1 4 3 5-3-1-5-1-7 0 2 2 4 2 6 2" stroke={P.twGreen700} strokeWidth="1.6" strokeLinecap="round" />
        <Path d="M16 6c1-3 3-4 5-5 0 2-1 4-3 5 3-1 5-1 7 0-2 2-4 2-6 2" stroke={P.twGreen700} strokeWidth="1.6" strokeLinecap="round" />
        <Path d="M12 8c0 0 2-1 4-1s4 1 4 1l-2.5 20c-.5 2-2.5 2-3 0L12 8z" fill={P.twOrange500} stroke={P.twOrange600} strokeWidth="1.5" />
        <Line x1="13" y1="13" x2="17" y2="14" stroke={P.twOrange700} strokeWidth="1.2" strokeLinecap="round" />
        <Line x1="14" y1="18" x2="18" y2="19" stroke={P.twOrange700} strokeWidth="1.2" strokeLinecap="round" />
        <Line x1="14.5" y1="23" x2="16.5" y2="23.5" stroke={P.twOrange700} strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function TomatoIllustration({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.illustrationContainer, { width: size, height: size, backgroundColor: P.twRed100 }]}>
      <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="18" r="10" fill={P.twRed600} />
        <Path d="M16 4v5M12 7l4 2 4-2M13 11l3-2 3 2" stroke={P.twGreen700} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 14c-1 2-1 5 1 7" stroke={P.twRed300} strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function CabbageIllustration({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.illustrationContainer, { width: size, height: size, backgroundColor: P.twGreen100 }]}>
      <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="10" fill={P.twGreen500} />
        <Path d="M9 16c0-4 3-7 7-7s7 3 7 7-3 7-7 7" stroke={P.green200} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 16c1-2 2.5-3 4-3s3 1 4 3-1 4-4 4-3.5-2-4-4z" fill={P.twGreen100} />
        <Path d="M16 8v16M11 13c3 1 7 1 10 0M11 19c3-1 7-1 10 0" stroke={P.twGreen700} strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Generic sprout for any crop without a dedicated illustration. */
function SproutIllustration({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.illustrationContainer, { width: size, height: size, backgroundColor: P.twGreen100 }]}>
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 22V10M12 10c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z"
          stroke={P.twGreen700}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function CropThumbnail({ cropType, imageUri }: { cropType: CropIllustrationType; imageUri?: string | undefined }) {
  const [imageError, setImageError] = useState(false);

  if (!imageUri || imageError) {
    if (cropType === 'carrot') return <CarrotIllustration />;
    if (cropType === 'tomato') return <TomatoIllustration />;
    if (cropType === 'cabbage') return <CabbageIllustration />;
    return <SproutIllustration />;
  }

  return (
    <View style={styles.thumbnailImgWrapper}>
      <Image
        source={{ uri: imageUri }}
        style={styles.thumbnailImg}
        onError={() => setImageError(true)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────

/** `'all'` or a real plot id. */
type ZoneFilter = string;
const ALL_ZONES: ZoneFilter = 'all';

type StatusFilter = 'any' | 'ready' | 'harvestSoon';
const STATUS_FILTERS: StatusFilter[] = ['any', 'ready', 'harvestSoon'];

function statusFilterLabel(filter: StatusFilter): string {
  switch (filter) {
    case 'any':
      return t('farmer.crops.calendar.statusAny');
    case 'ready':
      return t('farmer.crops.calendar.statusReady');
    case 'harvestSoon':
      return t('farmer.crops.calendar.statusHarvestSoon');
  }
}

function cropTitle(crop: CropItem): string {
  return crop.variety && crop.variety !== crop.name
    ? t('farmer.crops.calendar.cropTitle', { name: crop.name, variety: crop.variety })
    : crop.name;
}

function cropZoneLine(crop: CropItem): string {
  return crop.area ? t('farmer.crops.calendar.zoneArea', { zone: crop.zone, area: crop.area }) : crop.zone;
}

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────

export interface ProduceCalendarScreenProps {
  onBack?: () => void;
  /** Opens NewCropScreen, which creates the crop via createFarmCrop(). This
   * screen reloads from the API when it is shown again. */
  onNavigateToNewCrop?: () => void;
  onNavigateToCropDetail?: (crop: CropItem) => void;
}

export function ProduceCalendarScreen({
  onBack,
  onNavigateToNewCrop,
  onNavigateToCropDetail,
}: ProduceCalendarScreenProps): React.JSX.Element {
  const [entries, setEntries] = useState<FarmCropEntry[]>([]);
  const [plots, setPlots] = useState<DiaryPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const [selectedZone, setSelectedZone] = useState<ZoneFilter>(ALL_ZONES);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('any');
  const [showZonePicker, setShowZonePicker] = useState<boolean>(false);
  const [showStatusPicker, setShowStatusPicker] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadFarmCropEntries({ statuses: ACTIVE_CROP_STATUSES });
      setPlots(result.plots);
      setEntries(result.entries);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [onBack]);

  const filteredCrops = useMemo(() => {
    return entries
      .filter((entry) => {
        if (selectedZone !== ALL_ZONES && entry.plot.id !== selectedZone) return false;
        if (selectedStatus === 'ready') return entry.item.statusType === 'ready';
        if (selectedStatus === 'harvestSoon') {
          return entry.item.statusDays !== null && entry.item.statusDays <= HARVEST_SOON_WINDOW_DAYS;
        }
        return true;
      })
      .map((entry) => entry.item);
  }, [entries, selectedZone, selectedStatus]);

  const selectedZoneLabel =
    selectedZone === ALL_ZONES
      ? t('farmer.crops.calendar.zoneAll')
      : (plots.find((p) => p.id === selectedZone)?.name ?? t('farmer.crops.calendar.zoneAll'));
  const selectedStatusLabel = statusFilterLabel(selectedStatus);

  const zoneOptions: { value: ZoneFilter; label: string }[] = [
    { value: ALL_ZONES, label: t('farmer.crops.calendar.zoneAll') },
    ...plots.map((plot) => ({ value: plot.id, label: plot.name })),
  ];

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={44} borderRadius={12} />
          <Skeleton width="100%" height={120} borderRadius={16} />
          <Skeleton width="100%" height={120} borderRadius={16} />
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
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Filter Dropdowns Row ── */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowZonePicker(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.crops.calendar.filterZoneA11y', { value: selectedZoneLabel })}
          >
            <Text style={styles.filterButtonText} numberOfLines={1}>
              {selectedZoneLabel}
            </Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowStatusPicker(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.crops.calendar.filterStatusA11y', { value: selectedStatusLabel })}
          >
            <Text style={styles.filterButtonText} numberOfLines={1}>
              {selectedStatusLabel}
            </Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── Section Title ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('farmer.crops.calendar.sectionActive')}</Text>
        </View>

        {/* ── Crop Cards ── */}
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('farmer.crops.activeCrops.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('farmer.crops.calendar.emptySubtitle')}</Text>
          </View>
        ) : filteredCrops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('farmer.crops.calendar.emptyFilteredTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('farmer.crops.calendar.emptyFilteredSubtitle')}</Text>
          </View>
        ) : (
          <View style={styles.cropList}>
            {filteredCrops.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={styles.cropCard}
                activeOpacity={0.85}
                disabled={!onNavigateToCropDetail}
                onPress={() => onNavigateToCropDetail?.(crop)}
                accessibilityRole="button"
                accessibilityLabel={`${cropTitle(crop)}, ${cropZoneLine(crop)}`}
              >
                {/* Left accent bar */}
                <View style={[styles.cropCardAccent, { backgroundColor: crop.accentColor }]} />

                {/* Card Body */}
                <View style={styles.cropCardBody}>
                  {/* Top info row */}
                  <View style={styles.cardTopRow}>
                    <CropThumbnail cropType={crop.cropType} imageUri={crop.imageUri} />

                    <View style={styles.cropTitleCol}>
                      <Text style={styles.cropName}>{cropTitle(crop)}</Text>
                      <Text style={styles.cropZoneSubtitle}>{cropZoneLine(crop)}</Text>
                    </View>

                    {onNavigateToCropDetail && <ChevronRightIcon size={18} color={P.twGray400} />}
                  </View>

                  {/* Badges row */}
                  <View style={styles.badgesRow}>
                    {/* Age badge */}
                    <View style={styles.badgeGray}>
                      <ClockMiniIcon size={12} color={P.twGray600} />
                      <Text style={styles.badgeGrayText}>
                        {crop.daysOld !== null
                          ? t('farmer.crops.calendar.ageDays', { days: crop.daysOld })
                          : t('farmer.crops.calendar.ageUnknown')}
                      </Text>
                    </View>

                    {/* Status badge */}
                    {crop.statusType === 'ready' ? (
                      <View style={styles.badgeGreen}>
                        <CalendarMiniIcon size={12} color={P.twGreen700} />
                        <Text style={styles.badgeGreenText}>{crop.statusText}</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeGray}>
                        <CalendarMiniIcon size={12} color={P.twGray600} />
                        <Text style={styles.badgeGrayText}>{crop.statusText}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Space for FAB */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.farmDiary.common.goBackLabel')}
        >
          <ArrowBackIcon size={20} color={P.twGreen800} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{t('farmer.crops.calendar.title')}</Text>
          {!loading && !error && (
            <Text style={styles.headerSubtitle}>
              {t('farmer.crops.activeCrops.countSubtitle', { count: filteredCrops.length })}
            </Text>
          )}
        </View>
      </View>

      {renderBody()}

      {/* ── Floating Action Button: + New crop (opens NewCropScreen) ── */}
      {onNavigateToNewCrop && !loading && !error && (
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.85}
          onPress={onNavigateToNewCrop}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.crops.calendar.newCropA11y')}
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.fabText}>{t('farmer.crops.calendar.newCrop')}</Text>
        </TouchableOpacity>
      )}

      {/* ── Zone Filter Modal ── */}
      <Modal visible={showZonePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowZonePicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>{t('farmer.crops.calendar.selectZone')}</Text>
            {zoneOptions.map((zoneOpt) => (
              <TouchableOpacity
                key={zoneOpt.value}
                style={[
                  styles.pickerOption,
                  selectedZone === zoneOpt.value && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setSelectedZone(zoneOpt.value);
                  setShowZonePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedZone === zoneOpt.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {zoneOpt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Status Filter Modal ── */}
      <Modal visible={showStatusPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>{t('farmer.crops.calendar.selectStatus')}</Text>
            {STATUS_FILTERS.map((statusOpt) => (
              <TouchableOpacity
                key={statusOpt}
                style={[
                  styles.pickerOption,
                  selectedStatus === statusOpt && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setSelectedStatus(statusOpt);
                  setShowStatusPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedStatus === statusOpt && styles.pickerOptionTextSelected,
                  ]}
                >
                  {statusFilterLabel(statusOpt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (No raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: P.white,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
    zIndex: 10,
    elevation: 2,
  },
  headerTitleGroup: {
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.ink,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGreen700,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
    padding: 16,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
    padding: 24,
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterButtonText: {
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray800,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
  },
  cropList: {
    gap: 14,
  },
  cropCard: {
    flexDirection: 'row',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cropCardAccent: {
    width: 4.5,
  },
  cropCardBody: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  illustrationContainer: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImgWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: P.twGray100,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cropTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  cropName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  cropZoneSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  badgeGray: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGray100,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeGrayText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twGray600,
  },
  badgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twEmerald100,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeGreenText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGreen800,
  },
  bottomSpacer: {
    height: 80,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.deepGreen,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: P.white,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    marginLeft: 6,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray700,
  },
  emptySubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    backgroundColor: P.white,
    borderRadius: 16,
    width: '85%',
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerOptionSelected: {
    backgroundColor: P.twGreen100,
  },
  pickerOptionText: {
    fontSize: typography.bodyLarge,
    color: P.twGray800,
  },
  pickerOptionTextSelected: {
    fontWeight: '700',
    color: P.twGreen900,
  },
});
