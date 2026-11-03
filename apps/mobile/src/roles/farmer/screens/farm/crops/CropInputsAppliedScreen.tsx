import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Path } from 'react-native-svg';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P, radius, spacing, typography } from '../../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import {
  applicationTitle,
  applicationTypeLabel,
  formatAppliedDate,
  formatApplicationCost,
  useInputApplications,
  type ApplicationKind,
} from './inputApplications';

/**
 * "Inputs Applied" — the full input-application history. Two entry points:
 *  - Crop Detail → Inputs: `crop` is set, so only that crop's BR-56 inputs
 *    (and any pest treatment log recorded against that crop) are shown.
 *  - Input Management → Full history: `crop` is null, so every own crop's
 *    inputs (harvested ones included, from the farm-wide GET
 *    /farmers/me/crop-inputs, BR-56h) plus every zone's pest treatment logs
 *    are merged.
 *
 * Both input sources are cursor-paginated; the loader walks the one cursor to
 * the end (counts are then exact) and this screen reveals the merged list a
 * page at a time.
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
// Screen
// ─────────────────────────────────────────────

type Filter = 'all' | ApplicationKind;

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

  const subtitle = !crop?.id
    ? t('farmer.inputHistory.allCrops')
    : crop.variety
      ? t('farmer.inputHistory.cropSubtitle', { crop: crop.name, variety: crop.variety, zone: crop.zoneShort || crop.zone })
      : t('farmer.inputHistory.cropSubtitleNoVariety', { crop: crop.name, zone: crop.zoneShort || crop.zone });

  const applications = data?.applications ?? [];
  const fertigationCount = applications.filter((a) => a.kind === 'fertigation').length;
  const pestCount = applications.filter((a) => a.kind === 'pest').length;
  const filtered = activeFilter === 'all' ? applications : applications.filter((a) => a.kind === activeFilter);
  const visible = filtered.slice(0, visibleCount);

  const selectFilter = (filter: Filter) => {
    setActiveFilter(filter);
    setVisibleCount(ROWS_PER_PAGE);
  };

  const handleFabPress = () => {
    if (onNewInput) {
      onNewInput();
    } else {
      Alert.alert(t('farmer.inputHistory.title'), t('farmer.inputHistory.addHint'));
    }
  };

  const FILTERS: ReadonlyArray<{ key: Filter; label: string }> = [
    { key: 'all', label: t('farmer.inputHistory.filter.all') },
    { key: 'fertigation', label: t('farmer.inputManagement.type.fertigation') },
    { key: 'pest', label: t('farmer.inputManagement.type.pest') },
  ];

  const renderList = () => {
    if (state === 'loading') {
      return (
        <View testID="inputHistory.loading" style={styles.stateBox}>
          <ActivityIndicator color={P.deepGreen} />
          <Text style={styles.mutedText}>{t('farmer.common.loading')}</Text>
        </View>
      );
    }
    if (state === 'error' || data === null) {
      return (
        <View testID="inputHistory.error" style={styles.stateBox}>
          <Text style={styles.errorText}>{t('farmer.inputHistory.loadError')}</Text>
          <TouchableOpacity
            testID="inputHistory.retry"
            style={styles.outlineBtn}
            onPress={retry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.retry')}
          >
            <Text style={styles.outlineBtnText}>{t('farmer.common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (filtered.length === 0) {
      return (
        <View testID="inputHistory.empty" style={styles.stateBox}>
          <Text style={styles.mutedText}>{t('farmer.inputHistory.empty')}</Text>
        </View>
      );
    }
    return (
      <View style={styles.inputsList}>
        {visible.map((item) => {
          const isFertigation = item.kind === 'fertigation';
          return (
            <View key={item.key} testID={`inputHistory.row.${item.key}`} style={styles.inputCard}>
              <View
                style={[
                  styles.inputIconBadge,
                  isFertigation ? { backgroundColor: P.twBlue50 } : { backgroundColor: P.twRed50 },
                ]}
              >
                {isFertigation ? (
                  <DropletIcon size={18} color={P.twBlue600} />
                ) : (
                  <PestIcon size={18} color={P.twRed600} />
                )}
              </View>

              <View style={styles.inputTextCol}>
                <Text testID={`inputHistory.row.${item.key}.title`} style={styles.inputName}>
                  {applicationTitle(item)}
                </Text>
                <Text testID={`inputHistory.row.${item.key}.subtitle`} style={styles.inputSubtitle}>
                  {formatAppliedDate(item.appliedOn, true)}
                </Text>
                <View style={[styles.tagBadge, isFertigation ? styles.tagBadgeBlue : styles.tagBadgeRed]}>
                  <Text
                    style={[styles.tagBadgeText, isFertigation ? styles.tagBadgeTextBlue : styles.tagBadgeTextRed]}
                  >
                    {applicationTypeLabel(item.kind)}
                  </Text>
                </View>
              </View>

              <Text testID={`inputHistory.row.${item.key}.cost`} style={styles.inputCostText}>
                {formatApplicationCost(item.cost)}
              </Text>
            </View>
          );
        })}

        {filtered.length > visible.length ? (
          <TouchableOpacity
            testID="inputHistory.showMore"
            style={styles.outlineBtn}
            onPress={() => setVisibleCount((n) => n + ROWS_PER_PAGE)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.inputHistory.showMore')}
          >
            <Text style={styles.outlineBtnText}>{t('farmer.inputHistory.showMore')}</Text>
          </TouchableOpacity>
        ) : null}

        {data.complete ? null : (
          <Text testID="inputHistory.incomplete" style={styles.mutedText}>
            {t('farmer.inputHistory.incomplete')}
          </Text>
        )}
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
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: spacing.md, bottom: spacing.md, left: spacing.md, right: spacing.md }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.back')}
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
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twBlue50 }]}>
                <DropletIcon size={18} color={P.twBlue600} />
              </View>
              <Text testID="inputHistory.count.fertigation" style={styles.statValue}>
                {state === 'ready' ? String(fertigationCount) : t('farmer.inputHistory.placeholder')}
              </Text>
              <Text style={styles.statLabel}>{t('farmer.inputHistory.stat.fertigation')}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twRed50 }]}>
                <PestIcon size={18} color={P.twRed600} />
              </View>
              <Text testID="inputHistory.count.pest" style={styles.statValue}>
                {state === 'ready' ? String(pestCount) : t('farmer.inputHistory.placeholder')}
              </Text>
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
            {FILTERS.map(({ key, label }) => {
              const isSelected = activeFilter === key;
              return (
                <TouchableOpacity
                  key={key}
                  testID={`inputHistory.filter.${key}`}
                  style={[styles.filterChip, isSelected ? styles.filterChipActive : styles.filterChipInactive]}
                  onPress={() => selectFilter(key)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected ? styles.filterChipTextActive : styles.filterChipTextInactive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {renderList()}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* ── Floating Action Button (FAB) ── */}
        <TouchableOpacity
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
// Stylesheet (tokens only)
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: P.paleStoneBg,
  },
  backButton: {
    width: spacing.largeSection,
    height: spacing.largeSection,
    borderRadius: radius.full,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.pageMargin,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: spacing.lg,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statIconBadge: {
    width: spacing.largeSection,
    height: spacing.largeSection,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  },
  filterScrollView: {
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
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
    gap: spacing.md,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  inputIconBadge: {
    width: spacing.largeSection,
    height: spacing.largeSection,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputTextCol: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  inputName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  inputSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginBottom: spacing.xs,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
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
  inputCostText: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.ink,
  },
  stateBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  mutedText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.body,
    color: P.twRed600,
    textAlign: 'center',
  },
  outlineBtn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: P.deepGreen,
  },
  outlineBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.deepGreen,
  },
  bottomSpacer: {
    height: spacing.input,
  },
  fabButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.input,
    width: spacing.modalGap,
    height: spacing.modalGap,
    borderRadius: radius.full,
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
