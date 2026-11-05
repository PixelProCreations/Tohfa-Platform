import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, EmptyState, ErrorState, SafeAreaView, ScreenStatusBar, Skeleton } from '@tohfa/mobile-ui';
import Svg, { Circle, Path } from 'react-native-svg';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P, spacing, typography } from '../../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import {
  formatApplicationQuantity,
  formatAppliedDate,
  historyTypeLabel,
  useInputApplications,
  type ApplicationKind,
  type InputApplication,
} from './inputApplications';

/**
 * "Inputs Applied" — the input-application history. Two entry points:
 *  - Crop Detail → Inputs: `crop` is set, so only that crop's BR-56 inputs
 *    (and any pest treatment log recorded against that crop) are shown.
 *  - Input Management → Full history: `crop` is null, so every own crop's
 *    inputs (harvested ones included, GET /farmers/me/crop-inputs, BR-56h)
 *    plus every zone's pest treatment logs are merged; each row then names
 *    its crop (or zone) after the date.
 * The loader walks the cursor to the end so the stat counts are exact; the
 * list is revealed ROWS_PER_PAGE rows at a time.
 */

// Rows revealed per "Show more" tap (a layout choice, not a business threshold).
const ROWS_PER_PAGE = 20;

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
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

function DropletIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PestIcon({ size = 18, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 6V3M6 12H3M21 12h-3M6.34 6.34L4.22 4.22M19.78 4.22l-2.12 2.12M6.34 17.66l-2.12 2.12M19.78 19.78l-2.12-2.12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlusIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Filter = 'all' | ApplicationKind;

const FILTERS: readonly Filter[] = ['all', 'fertigation', 'pest'];

function filterLabel(filter: Filter): string {
  return filter === 'all' ? t('farmer.inputHistory.filter.all') : historyTypeLabel(filter);
}

export interface CropInputsAppliedScreenProps {
  /** Set for one crop's history; null/undefined for the farm-wide history. */
  crop?: CropItem | null;
  onBack?: () => void;
  onNewInput?: () => void;
}

export function CropInputsAppliedScreen({
  crop,
  onBack,
  onNewInput,
}: CropInputsAppliedScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [visibleCount, setVisibleCount] = useState(ROWS_PER_PAGE);

  // Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const scopedCrop = useMemo(
    () => (crop?.id ? { id: crop.id, name: crop.name, zone: crop.zone || null } : null),
    [crop?.id, crop?.name, crop?.zone],
  );
  const { state, data, retry, refreshing, refresh } = useInputApplications('history', scopedCrop);

  const isFarmWide = scopedCrop === null;
  const zone = crop?.zoneShort || crop?.zone || '';
  const subtitle = isFarmWide
    ? t('farmer.inputHistory.allCrops')
    : crop?.variety
      ? t('farmer.inputHistory.cropSubtitle', { crop: crop.name, variety: crop.variety, zone })
      : t('farmer.inputHistory.cropSubtitleNoVariety', { crop: crop?.name ?? '', zone });

  const applications = data?.applications ?? [];
  const fertigationCount = applications.filter((a) => a.kind === 'fertigation').length;
  const pestCount = applications.filter((a) => a.kind === 'pest').length;
  const countText = (n: number) => (state === 'ready' ? String(n) : t('farmer.inputHistory.placeholder'));

  const filteredInputs = activeFilter === 'all' ? applications : applications.filter((a) => a.kind === activeFilter);
  const visibleInputs = filteredInputs.slice(0, visibleCount);

  const selectFilter = (filter: Filter) => {
    setActiveFilter(filter);
    setVisibleCount(ROWS_PER_PAGE);
  };

  // Dev showed extra context after the date ("· Aphids"); the farm-wide list names the crop, or the zone.
  const rowSubtitle = (item: InputApplication): string => {
    const date = formatAppliedDate(item.appliedOn);
    const where = isFarmWide ? (item.cropName ?? item.zoneName) : null;
    return where === null ? date : `${date} · ${where}`;
  };

  const handleFabPress = () => {
    if (onNewInput) {
      onNewInput();
    } else if (crop) {
      Alert.alert(
        t('farmer.inputHistory.applyInput.title'),
        t('farmer.inputHistory.applyInput.body', { crop: crop.name, zone }),
      );
    } else {
      Alert.alert(t('farmer.inputHistory.applyInput.title'), t('farmer.inputHistory.addHint'));
    }
  };

  const renderList = () => {
    if (state === 'loading') {
      return (
        <View testID="inputHistory.loading" style={styles.stateBox}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </View>
      );
    }
    if (state === 'error' || data === null) {
      return (
        <View testID="inputHistory.error" style={styles.stateBox}>
          <ErrorState
            message={t('farmer.inputHistory.loadError')}
            onRetry={retry}
            retryTitle={t('farmer.common.retry')}
          />
        </View>
      );
    }
    if (filteredInputs.length === 0) {
      return (
        <View testID="inputHistory.empty" style={styles.stateBox}>
          <EmptyState title={t('farmer.inputHistory.empty')} />
        </View>
      );
    }
    return (
      <View style={styles.inputsList}>
        {visibleInputs.map((item) => {
          const isFertigation = item.kind === 'fertigation';
          return (
            <View key={item.key} testID={`inputHistory.row.${item.key}`} style={styles.inputCard}>
              {/* Category-specific Icon Badge */}
              <View
                style={[
                  styles.inputIconBadge,
                  isFertigation
                    ? { backgroundColor: P.twBlue50 }
                    : { backgroundColor: P.twRed50 },
                ]}
              >
                {isFertigation ? (
                  <DropletIcon size={18} color={P.twBlue600} />
                ) : (
                  <PestIcon size={18} color={P.twRed600} />
                )}
              </View>

              <View style={styles.inputTextCol}>
                <Text testID={`inputHistory.row.${item.key}.title`} style={styles.inputName}>{item.name}</Text>
                <Text testID={`inputHistory.row.${item.key}.subtitle`} style={styles.inputSubtitle}>
                  {rowSubtitle(item)}
                </Text>

                {/* Tag badge */}
                <View
                  style={[
                    styles.tagBadge,
                    isFertigation ? styles.tagBadgeBlue : styles.tagBadgeRed,
                  ]}
                >
                  <Text
                    testID={`inputHistory.row.${item.key}.tag`}
                    style={[
                      styles.tagBadgeText,
                      isFertigation ? styles.tagBadgeTextBlue : styles.tagBadgeTextRed,
                    ]}
                  >
                    {historyTypeLabel(item.kind)}
                  </Text>
                </View>
              </View>

              {/* Quantity */}
              <Text testID={`inputHistory.row.${item.key}.quantity`} style={styles.inputQuantityText}>
                {formatApplicationQuantity(item.quantity)}
              </Text>
            </View>
          );
        })}

        {filteredInputs.length > visibleInputs.length ? (
          <Button
            testID="inputHistory.showMore"
            title={t('farmer.inputHistory.showMore')}
            variant="outline"
            onPress={() => setVisibleCount((n) => n + ROWS_PER_PAGE)}
          />
        ) : null}

        {data.complete ? null : (
          <Text testID="inputHistory.incomplete" style={styles.inputSubtitle}>
            {t('farmer.inputHistory.incomplete')}
          </Text>
        )}
        {/* Some zone's pest treatment logs failed to load: the rest is shown, and this says so. */}
        {data.partial ? (
          <Text testID="inputHistory.partial" style={styles.inputSubtitle}>
            {t('farmer.inputHistory.partial')}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />

      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="inputHistory.back"
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.inputHistory.back')}
          >
            <ArrowBackIcon size={20} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>{t('farmer.inputHistory.title')}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={P.deepGreen} />}
        >
          {/* ── Top Stat Cards ── */}
          <View style={styles.statsRow}>
            {/* Card 1: Fertigation Events */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twBlue50 }]}>
                <DropletIcon size={18} color={P.twBlue600} />
              </View>
              <Text testID="inputHistory.count.fertigation" style={styles.statValue}>{countText(fertigationCount)}</Text>
              <Text style={styles.statLabel}>{t('farmer.inputHistory.stat.fertigation')}</Text>
            </View>

            {/* Card 2: Pest Treatments */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twRed50 }]}>
                <PestIcon size={18} color={P.twRed600} />
              </View>
              <Text testID="inputHistory.count.pest" style={styles.statValue}>{countText(pestCount)}</Text>
              <Text style={styles.statLabel}>{t('farmer.inputHistory.stat.pest')}</Text>
            </View>
          </View>

          {/* ── Filter Pills ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScrollView}
          >
            {FILTERS.map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  testID={`inputHistory.filter.${filter}`}
                  style={[
                    styles.filterChip,
                    isSelected ? styles.filterChipActive : styles.filterChipInactive,
                  ]}
                  onPress={() => selectFilter(filter)}
                  activeOpacity={0.75}
                >
                  <Text
                    testID={`inputHistory.filter.${filter}.label`}
                    style={[
                      styles.filterChipText,
                      isSelected ? styles.filterChipTextActive : styles.filterChipTextInactive,
                    ]}
                  >
                    {filterLabel(filter)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Inputs Activity Cards List ── */}
          {renderList()}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* ── Floating Action Button (FAB) ── */}
        <TouchableOpacity
          testID="inputHistory.fab"
          style={styles.fabButton}
          onPress={handleFabPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.inputHistory.add')}
        >
          <PlusIcon size={24} color={P.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: P.paleStoneBg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
  },
  statLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  filterScrollView: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: P.deepGreen,
  },
  filterChipInactive: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray300,
  },
  filterChipText: {
    fontSize: typography.body,
  },
  filterChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: P.twGray700,
    fontWeight: '600',
  },
  inputsList: {
    gap: 10,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  inputIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  inputName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  inputSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 6,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  tagBadgeBlue: {
    backgroundColor: P.twBlue50,
  },
  tagBadgeRed: {
    backgroundColor: P.twRed50,
  },
  tagBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  tagBadgeTextBlue: {
    color: P.twBlue700,
  },
  tagBadgeTextRed: {
    color: P.twRed600,
  },
  inputQuantityText: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.ink,
  },
  bottomSpacer: {
    height: 20,
  },
  // New (not on Dev): wrapper for the loading / error / empty states of the list.
  stateBox: {
    gap: spacing.sm,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
