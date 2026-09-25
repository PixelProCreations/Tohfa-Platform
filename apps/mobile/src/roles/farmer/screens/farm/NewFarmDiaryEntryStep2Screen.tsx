import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { formatErrorMessage } from '../../../../shell/api/client';
import { authPalette as P } from '../../theme';
import { getDiaryTaxonomy, type DiaryCategory, type DiaryTaxonomy } from '../../api/farmDiary';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 18, color = P.slate800 }: { size?: number; color?: string }) {
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

function ArrowRightIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* 12 Category Icons */

function MountainIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 20L10 8L15 15L17 12L21 20H3Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SowingSeedIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21V10M12 10c0-4 3-6 7-6 0 4-2 7-7 6zM12 14c0-3.5-2.5-5-6-5 0 3.5 2 5.5 6 5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 21h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function NutrientsCircleIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a9 9 0 0 1 9 9c0 2.2-.8 4.2-2.1 5.8M5.1 17.8A9 9 0 0 1 3 12a9 9 0 0 1 9-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M12 8c-2 2-3 4-3 5.5a3 3 0 0 0 6 0C15 12 14 10 12 8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M19 7l2 5-5-1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WaterDropletIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PestBugIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20a6 6 0 0 0 6-6V9a6 6 0 1 0-12 0v5a6 6 0 0 0 6 6z M12 3v1 M7 6l-2-2 M17 6l2-2 M3 11h2 M19 11h2 M5 16l-2 2 M19 16l2 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ScissorsIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="2" />
      <Line x1="20" y1="4" x2="8.12" y2="15.88" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14.47" y1="14.48" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8.12" y1="8.12" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function TractorHarvestIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="17" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="17" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M4 17H2V9h5v8M10 17h4M14 9h7v8M9 9h5v8M14 12h7M14 9l2-4h3l2 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CrateBoxIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="15" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="11" x2="21" y2="11" stroke={color} strokeWidth="2" />
      <Line x1="9" y1="11" x2="9" y2="17" stroke={color} strokeWidth="2" />
      <Line x1="15" y1="11" x2="15" y2="17" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ToolsHammerIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PawIcon({ size = 22, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="15" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="10" cy="5.5" r="2.2" fill={color} />
      <Circle cx="14" cy="5.5" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Icon lookup (taxonomy `iconKey` → inline icon)
// ─────────────────────────────────────────────

type IconComponentType = React.ComponentType<{ size?: number; color?: string }>;

/**
 * The taxonomy is admin-managed, so a category can arrive with an `iconKey`
 * this build has never heard of (or none at all). Unknown keys fall back to
 * FALLBACK_CATEGORY_ICON rather than crashing the grid.
 */
const CATEGORY_ICONS: Record<string, IconComponentType> = {
  mountain: MountainIcon,
  sowing_seed: SowingSeedIcon,
  nutrients_circle: NutrientsCircleIcon,
  water_droplet: WaterDropletIcon,
  shield: ShieldIcon,
  pest_bug: PestBugIcon,
  scissors: ScissorsIcon,
  search: SearchIcon,
  tractor_harvest: TractorHarvestIcon,
  crate_box: CrateBoxIcon,
  tools_hammer: ToolsHammerIcon,
  paw: PawIcon,
};

const FALLBACK_CATEGORY_ICON: IconComponentType = MountainIcon;

function iconForCategory(iconKey: string | null): IconComponentType {
  return (iconKey !== null ? CATEGORY_ICONS[iconKey] : undefined) ?? FALLBACK_CATEGORY_ICON;
}

/** Active-only, sorted — inactive rows are excluded server-side too; this is defensive. */
function activeCategories(taxonomy: DiaryTaxonomy): DiaryCategory[] {
  return taxonomy.categories
    .filter((c) => c.isActive)
    .map((c) => ({
      ...c,
      subActivities: c.subActivities
        .filter((s) => s.isActive && s.categoryKey === c.key)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ─────────────────────────────────────────────
// Props & Component
// ─────────────────────────────────────────────

export interface NewFarmDiaryEntryStep2Data {
  categoryKey: string;
  categoryName: string;
  subActivityKey: string;
  subActivityName: string;
}

export interface NewFarmDiaryEntryStep2ScreenProps {
  crop?: CropItem | null;
  /** Taxonomy key of the category to pre-select, if any. */
  categoryKey?: string | undefined;
  onChangeCategory?: () => void;
  onBack?: () => void;
  onCancel?: () => void;
  onNext?: (entryData: NewFarmDiaryEntryStep2Data) => void;
}

type LoadState = 'loading' | 'error' | 'ready';

export function NewFarmDiaryEntryStep2Screen({
  crop: _crop,
  categoryKey: initialCategoryKey,
  onBack,
  onCancel,
  onNext,
}: NewFarmDiaryEntryStep2ScreenProps): React.JSX.Element {
  const [categories, setCategories] = useState<DiaryCategory[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);

  const [selectedCatKey, setSelectedCatKey] = useState<string | null>(null);
  const [selectedSubActivityKey, setSelectedSubActivityKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');
    getDiaryTaxonomy(controller.signal)
      .then((taxonomy) => {
        if (controller.signal.aborted) return;
        const active = activeCategories(taxonomy);
        setCategories(active);
        const initial =
          active.find((c) => initialCategoryKey !== undefined && c.key === initialCategoryKey) ??
          active[0];
        setSelectedCatKey(initial?.key ?? null);
        setSelectedSubActivityKey(initial?.subActivities[0]?.key ?? null);
        setLoadState('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(formatErrorMessage(err, 'Could not load activity types.'));
        setLoadState('error');
      });
    return () => controller.abort();
  }, [reloadKey, initialCategoryKey]);

  const activeCategory = categories.find((c) => c.key === selectedCatKey) ?? null;
  const selectedSubActivity =
    activeCategory?.subActivities.find((s) => s.key === selectedSubActivityKey) ?? null;
  const canProceed = activeCategory !== null && selectedSubActivity !== null;

  const handleSelectCategory = (cat: DiaryCategory) => {
    setSelectedCatKey(cat.key);
    setSelectedSubActivityKey(cat.subActivities[0]?.key ?? null);
  };

  const handleProceed = () => {
    if (!activeCategory || !selectedSubActivity) return;
    onNext?.({
      categoryKey: activeCategory.key,
      categoryName: activeCategory.name,
      subActivityKey: selectedSubActivity.key,
      subActivityName: selectedSubActivity.name,
    });
  };

  const handleExit = onCancel ?? onBack;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.navCircleButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={18} color={P.twGreen700} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>New Entry</Text>
            <Text style={styles.headerSubtitle}>Step 2 of 3 · Activity Type</Text>
          </View>

          <TouchableOpacity
            onPress={handleExit}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3-Segment Progress Bar ── */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressInactive]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadState === 'loading' ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={P.twGreen700} />
            <Text style={styles.statusText}>Loading activity types…</Text>
          </View>
        ) : loadState === 'error' ? (
          <View style={[styles.statusBox, styles.errorBox]}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setReloadKey((k) => k + 1)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Retry loading activity types"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>No activity types are available right now.</Text>
          </View>
        ) : (
          <>
            {/* ── 1. Category Section Heading ── */}
            <Text style={styles.sectionHeading}>CATEGORY</Text>

            {/* ── 3-Column Categories Grid ── */}
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCatKey === cat.key;
                const Icon = iconForCategory(cat.iconKey);
                const iconColor = isSelected ? P.twGreen800 : P.twGray700;

                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={cat.name}
                  >
                    {isSelected && <View style={styles.selectedDot} />}
                    <Icon size={24} color={iconColor} />
                    <Text
                      style={[
                        styles.categoryCardText,
                        isSelected && styles.categoryCardTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeCategory && (
              <>
                {/* ── 2. Sub-Activity Section Heading ── */}
                <Text style={styles.sectionHeading}>
                  SUB-ACTIVITY · {activeCategory.name.toUpperCase()}
                </Text>

                {/* ── Sub-Activity Radio Options List ── */}
                <View style={styles.subActivityList}>
                  {activeCategory.subActivities.length === 0 ? (
                    <Text style={styles.statusText}>
                      No sub-activities are available for this category.
                    </Text>
                  ) : (
                    activeCategory.subActivities.map((subAct) => {
                      const isSelected = selectedSubActivityKey === subAct.key;

                      return (
                        <TouchableOpacity
                          key={subAct.key}
                          style={[
                            styles.subActivityOption,
                            isSelected && styles.subActivityOptionSelected,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => setSelectedSubActivityKey(subAct.key)}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isSelected }}
                        >
                          {/* Radio Circle */}
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected && styles.radioOuterSelected,
                            ]}
                          >
                            {isSelected && <View style={styles.radioInner} />}
                          </View>

                          {/* Sub-Activity Text */}
                          <Text
                            style={[
                              styles.subActivityText,
                              isSelected && styles.subActivityTextSelected,
                            ]}
                          >
                            {subAct.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Bottom Sticky Action Buttons ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowBackIcon size={16} color={P.slate800} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={handleProceed}
          disabled={!canProceed}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Proceed to Next Details"
          accessibilityState={{ disabled: !canProceed }}
        >
          <Text style={styles.nextButtonText}>Next · Details</Text>
          <ArrowRightIcon size={16} color={P.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    color: P.slate900,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: P.slate500,
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtnText: {
    color: P.slate600,
    fontSize: 14,
    fontWeight: '600',
  },

  /* 3-Segment Progress */
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: P.twGreen700,
  },
  progressInactive: {
    backgroundColor: P.slate200,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },

  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  /* 3-Column Categories Grid */
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1.15,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
  },
  categoryCardSelected: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen600,
    borderWidth: 1.5,
  },
  selectedDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.twGreen800,
  },
  categoryCardText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: P.slate700,
    marginTop: 7,
    textAlign: 'center',
  },
  categoryCardTextSelected: {
    color: P.twGreen900,
    fontWeight: '700',
  },

  /* Sub-Activities */
  subActivityList: {
    gap: 10,
  },
  subActivityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  subActivityOptionSelected: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen600,
    borderWidth: 1.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: P.slate300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: P.twGreen800,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: P.twGreen800,
  },
  subActivityText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.slate700,
    flex: 1,
  },
  subActivityTextSelected: {
    fontWeight: '700',
    color: P.slate900,
  },

  /* Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: P.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
    gap: 6,
  },
  backButtonText: {
    color: P.slate800,
    fontSize: 14.5,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 24,
    backgroundColor: P.twGreen800,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: P.white,
    fontSize: 14.5,
    fontWeight: '700',
  },

  /* Loading / error / empty states */
  statusBox: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 13,
    color: P.slate500,
  },
  errorBox: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
  },
  errorText: {
    fontSize: 13,
    color: P.twRed700,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twRed200,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twRed700,
  },
});
