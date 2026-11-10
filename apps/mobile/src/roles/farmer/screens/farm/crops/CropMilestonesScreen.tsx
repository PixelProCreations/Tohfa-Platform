import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState, ErrorState, SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import { authPalette as P, spacing, typography } from '../../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import {
  getFarmCrop,
  listCropMilestones,
  listCropMilestoneTemplates,
  updateCropMilestone,
  type CropMilestoneResponse,
  type CropMilestonesListResponse,
  type CropMilestoneTemplateResponse,
} from '../../../api/crops';
import { formatAppliedDate } from './inputApplications';

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

function ChevronLeftIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
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

function CheckMiniIcon({ size = 14, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TargetMetricIcon({ size = 15, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

function CalendarIcon({ size = 15, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function SparklesIcon({ size = 14, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlagIcon({ size = 16, color = P.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Screen Props & Implementation
// ─────────────────────────────────────────────

export interface CropMilestonesScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
}

/** Shown wherever the API has no value; never replaced by a sample one. */
const NO_VALUE = '—';

/** `"2026-09-03"` -> `"3 Sep 2026"` (month from the i18n catalogue); null -> NO_VALUE. */
function formatDate(iso: string | null | undefined): string {
  return iso ? formatAppliedDate(iso.slice(0, 10), true) : NO_VALUE;
}

/**
 * The category pill is the milestone's own stage code, translated. The six
 * codes seeded by migration 0036 have catalogue entries; any other code the
 * server sends is still shown, made readable (`STAGE_FRUITING` -> `Fruiting`),
 * rather than hidden. The stage name itself is the card title.
 */
const STAGE_CATEGORY_KEY: Partial<Record<string, TranslationKey>> = {
  STAGE_SOWING: 'farmer.cropMilestones.stage.STAGE_SOWING',
  STAGE_VEGETATIVE: 'farmer.cropMilestones.stage.STAGE_VEGETATIVE',
  STAGE_FLOWERING: 'farmer.cropMilestones.stage.STAGE_FLOWERING',
  STAGE_FRUITING: 'farmer.cropMilestones.stage.STAGE_FRUITING',
  STAGE_MATURITY: 'farmer.cropMilestones.stage.STAGE_MATURITY',
  STAGE_HARVEST: 'farmer.cropMilestones.stage.STAGE_HARVEST',
};

function stageCategory(stageCode: string): string {
  const key = STAGE_CATEGORY_KEY[stageCode];
  if (key !== undefined) return t(key);
  const words = stageCode.replace(/^STAGE_/, '').replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function recordedOutcome(m: CropMilestoneResponse): string {
  if (m.status === 'COMPLETED') {
    return m.completedOn
      ? t('farmer.cropMilestones.outcomeCompletedOn', { date: formatDate(m.completedOn) })
      : t('farmer.cropMilestones.outcomeCompleted');
  }
  if (m.status === 'SKIPPED') return t('farmer.cropMilestones.outcomeSkipped');
  return t('farmer.cropMilestones.outcomePending');
}

type LoadState = 'idle' | 'loading' | 'error' | 'ready';

export function CropMilestonesScreen({
  crop,
  onBack,
}: CropMilestonesScreenProps): React.JSX.Element {
  // Listen for hardware back button on Android
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

  const cropId = crop?.id;

  // Real data (BR-57). The milestones list auto-initialises from templates on
  // first read (BR-57b), so no separate initialise call is needed here. The
  // templates supply each stage's description and expected day; the farm crop
  // supplies the expected harvest date for the subtitle.
  const [loadState, setLoadState] = useState<LoadState>(cropId ? 'loading' : 'idle');
  const [data, setData] = useState<CropMilestonesListResponse | null>(null);
  const [templates, setTemplates] = useState<CropMilestoneTemplateResponse[]>([]);
  const [expectedHarvestOn, setExpectedHarvestOn] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [updateFailed, setUpdateFailed] = useState(false);

  const load = useCallback(async () => {
    if (!cropId) {
      setLoadState('idle');
      return;
    }
    setLoadState('loading');
    try {
      // Templates are read for the crop's own crop_master so crop-specific
      // templates (which win over universal ones, BR-57b) are included.
      const [milestonesRes, farmCrop] = await Promise.all([
        listCropMilestones(cropId),
        getFarmCrop(cropId),
      ]);
      const templatesRes = await listCropMilestoneTemplates(farmCrop.cropMasterId);
      setData(milestonesRes);
      setTemplates(templatesRes);
      setExpectedHarvestOn(farmCrop.expectedHarvestOn);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [cropId]);

  useEffect(() => {
    void load();
  }, [load]);

  const templatesById = useMemo(() => new Map(templates.map((tpl) => [tpl.id, tpl])), [templates]);
  const milestones = data?.items ?? [];

  const title = crop ? `${crop.name} — ${crop.variety}` : NO_VALUE;
  const subtitle = crop
    ? t('farmer.cropMilestones.subtitleExpected', { zone: crop.zone, date: formatDate(expectedHarvestOn) })
    : NO_VALUE;
  const daysOld = crop?.daysOld ?? NO_VALUE;

  // Counts and progress are the server's (BR-57c: only COMPLETED counts).
  const achievedCount = data?.completedCount ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const progressPercent = Math.round(data?.progressPct ?? 0);

  // Active or selected milestone: the first one not yet completed.
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const defaultSelected = milestones.find((m) => m.status === 'PENDING') ?? milestones[0];
  const selectedMilestone =
    milestones.find((m) => m.id === selectedMilestoneId) ?? defaultSelected;
  const selectedIndex = selectedMilestone
    ? milestones.findIndex((m) => m.id === selectedMilestone.id)
    : -1;
  const selectedTemplate =
    selectedMilestone?.templateId ? templatesById.get(selectedMilestone.templateId) : undefined;
  const selectedAchieved = selectedMilestone?.status === 'COMPLETED';

  // Toggle Completed action: PATCH the status, then re-read the list so the
  // counts and progress shown are the server's, not a client recomputation.
  const handleToggleComplete = async (m: CropMilestoneResponse) => {
    if (!cropId || togglingId) return;
    setTogglingId(m.id);
    setUpdateFailed(false);
    try {
      // Going back to PENDING also clears completedOn: the PATCH schema accepts
      // `completedOn: null` and the repo writes it, whereas a bare status change
      // would leave the old completion date on a milestone that is no longer done.
      await updateCropMilestone(
        cropId,
        m.id,
        m.status === 'COMPLETED' ? { status: 'PENDING', completedOn: null } : { status: 'COMPLETED' },
      );
      setSelectedMilestoneId(m.id);
      setData(await listCropMilestones(cropId));
    } catch {
      setUpdateFailed(true);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top App Bar ── */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.cropMilestones.goBack')}
        >
          <ArrowBackIcon size={20} color={P.ink} />
        </TouchableOpacity>

        <View style={styles.appBarTitleCol}>
          <Text style={styles.appBarTitle}>{t('farmer.cropMilestones.title')}</Text>
          <Text style={styles.appBarSubtitle}>{title}</Text>
        </View>

        {data ? (
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>
              {t('farmer.cropMilestones.doneBadge', { done: achievedCount, total: totalCount })}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadState === 'idle' ? (
          <EmptyState title={t('farmer.cropMilestones.noCrop')} />
        ) : loadState === 'loading' ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator
              color={P.brandGreen}
              accessibilityLabel={t('farmer.cropMilestones.loading')}
            />
          </View>
        ) : loadState === 'error' ? (
          <ErrorState
            title={t('farmer.cropMilestones.loadErrorTitle')}
            message={t('farmer.cropMilestones.loadErrorMessage')}
            retryTitle={t('farmer.cropMilestones.retry')}
            onRetry={() => void load()}
          />
        ) : (
          <>
        {/* ── Summary Progress Banner ── */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeaderRow}>
            <View style={styles.bannerIconBadge}>
              <FlagIcon size={18} color={P.brandGreen} />
            </View>
            <View style={styles.bannerTitleCol}>
              <Text style={styles.bannerCropTitle}>{title}</Text>
              <Text style={styles.bannerCropSubtitle}>{subtitle}</Text>
            </View>
            <View style={styles.bannerPercentBadge}>
              <Text style={styles.bannerPercentText}>{progressPercent}%</Text>
            </View>
          </View>

          {/* Progress Track Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.bannerFooterRow}>
            <Text style={styles.bannerFooterText}>
              {t('farmer.cropMilestones.completedSummary', { done: achievedCount, total: totalCount })}
            </Text>
            <Text style={styles.bannerFooterSub}>
              {t('farmer.cropMilestones.lifecycleDay', { day: daysOld })}
            </Text>
          </View>
        </View>

        {milestones.length === 0 ? (
          <EmptyState title={t('farmer.cropMilestones.empty')} />
        ) : null}

        {/* ── Horizontal Milestone Tabs ── */}
        {milestones.length > 0 ? (
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {milestones.map((m) => {
              const isAchieved = m.status === 'COMPLETED';
              const isSelected = m.id === selectedMilestone?.id;

              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.tabButton,
                    isAchieved && styles.tabButtonAchieved,
                    isSelected && styles.tabButtonSelected,
                  ]}
                  onPress={() => setSelectedMilestoneId(m.id)}
                  activeOpacity={0.75}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={t('farmer.cropMilestones.tabA11y', {
                    number: m.sequenceOrder,
                    title: m.stageName,
                  })}
                >
                  <View
                    style={[
                      styles.tabBadge,
                      isAchieved && styles.tabBadgeAchieved,
                      isSelected && styles.tabBadgeSelected,
                    ]}
                  >
                    {isAchieved ? (
                      <CheckMiniIcon size={12} color={isSelected ? P.brandGreen : P.white} />
                    ) : (
                      <Text
                        style={[
                          styles.tabBadgeNumber,
                          isSelected && styles.tabBadgeNumberSelected,
                        ]}
                      >
                        {m.sequenceOrder}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.tabLabel,
                      isAchieved && styles.tabLabelAchieved,
                      isSelected && styles.tabLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {t('farmer.cropMilestones.tabLabel', {
                      number: m.sequenceOrder,
                      category: stageCategory(m.stageCode),
                    })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        ) : null}

        {/* ── Selected Milestone Details Card ── */}
        {selectedMilestone && (
          <View style={styles.selectedMilestoneCard}>
            {/* Header with Title, Tag & Complete Button */}
            <View style={styles.selectedMilestoneHeaderRow}>
              <View style={styles.selectedMilestoneTitleCol}>
                <View style={styles.milestoneTagRow}>
                  <Text style={styles.milestoneNumberText}>
                    {t('farmer.cropMilestones.milestoneOf', {
                      number: selectedMilestone.sequenceOrder,
                      total: totalCount,
                    })}
                  </Text>
                  <View style={styles.milestoneCategoryPill}>
                    <Text style={styles.milestoneCategoryText}>
                      {stageCategory(selectedMilestone.stageCode)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.selectedMilestoneTitle}>{selectedMilestone.stageName}</Text>

                <View style={styles.milestoneDateRow}>
                  <CalendarIcon size={13} color={P.twGray400} />
                  <Text style={styles.selectedMilestoneDate}>
                    {t('farmer.cropMilestones.targetDay', {
                      day: selectedTemplate?.expectedDaysAfterPlanting ?? NO_VALUE,
                      date: formatDate(selectedMilestone.targetDate),
                    })}
                  </Text>
                </View>
              </View>

              {/* Interactive Completed Action Button */}
              <TouchableOpacity
                style={[
                  styles.completeActionButton,
                  selectedAchieved && styles.completeActionButtonAchieved,
                ]}
                onPress={() => void handleToggleComplete(selectedMilestone)}
                disabled={togglingId !== null}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityState={{ busy: togglingId === selectedMilestone.id }}
                accessibilityLabel={
                  selectedAchieved
                    ? t('farmer.cropMilestones.markInProgressA11y')
                    : t('farmer.cropMilestones.markCompletedA11y')
                }
              >
                {selectedAchieved ? (
                  <>
                    <CheckMiniIcon size={14} color={P.white} />
                    <Text style={styles.completeActionButtonTextAchieved}>
                      {t('farmer.cropMilestones.completed')}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.uncompletedCircleIcon}>
                      <CheckMiniIcon size={10} color={P.twGreen700} />
                    </View>
                    <Text style={styles.completeActionButtonText}>
                      {t('farmer.cropMilestones.markDone')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {updateFailed ? (
              <Text style={styles.updateErrorText} accessibilityRole="alert">
                {t('farmer.cropMilestones.updateError')}
              </Text>
            ) : null}

            {/* Target vs Actual Deliverables Grid */}
            <View style={styles.milestoneDeliverablesGrid}>
              {/* Target Card */}
              <View style={styles.milestoneDeliverableCard}>
                <View style={styles.deliverableCardHeader}>
                  <TargetMetricIcon size={13} color={P.twGray500} />
                  <Text style={styles.deliverableCardLabel}>
                    {t('farmer.cropMilestones.targetDeliverable')}
                  </Text>
                </View>
                <Text style={styles.deliverableCardValue}>
                  {selectedTemplate?.description ?? NO_VALUE}
                </Text>
              </View>

              {/* Recorded Outcome Card */}
              <View
                style={[
                  styles.milestoneDeliverableCard,
                  selectedAchieved && styles.milestoneDeliverableCardAchieved,
                ]}
              >
                <View style={styles.deliverableCardHeader}>
                  <CheckMiniIcon
                    size={13}
                    color={selectedAchieved ? P.twGreen700 : P.twGray400}
                  />
                  <Text
                    style={[
                      styles.deliverableCardLabel,
                      selectedAchieved && styles.deliverableCardLabelAchieved,
                    ]}
                  >
                    {t('farmer.cropMilestones.recordedOutcome')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.deliverableCardValue,
                    selectedAchieved && styles.deliverableCardValueAchieved,
                  ]}
                >
                  {recordedOutcome(selectedMilestone)}
                </Text>
              </View>
            </View>

            {/* Agronomist Field / Observation Note */}
            <View style={styles.milestoneObservationCard}>
              <View style={styles.observationHeaderRow}>
                <SparklesIcon size={13} color={P.twGreen700} />
                <Text style={styles.observationHeaderTitle}>
                  {t('farmer.cropMilestones.fieldObservation')}
                </Text>
              </View>
              <Text style={styles.observationCardText}>
                {selectedMilestone.notes
                  ? `“${selectedMilestone.notes}”`
                  : t('farmer.cropMilestones.noNote')}
              </Text>
            </View>

            {/* Stepper Navigation Buttons (Prev / Next) */}
            <View style={styles.stepperNavControlsRow}>
              <TouchableOpacity
                style={[
                  styles.stepperNavBtn,
                  selectedIndex <= 0 && styles.stepperNavBtnDisabled,
                ]}
                disabled={selectedIndex <= 0}
                onPress={() => {
                  if (selectedIndex > 0) {
                    const prevMilestone = milestones[selectedIndex - 1];
                    if (prevMilestone) setSelectedMilestoneId(prevMilestone.id);
                  }
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.cropMilestones.prevA11y')}
              >
                <ChevronLeftIcon
                  size={16}
                  color={selectedIndex <= 0 ? P.twGray300 : P.twGreen700}
                />
                <Text
                  style={[
                    styles.stepperNavBtnText,
                    selectedIndex <= 0 && styles.stepperNavBtnTextDisabled,
                  ]}
                >
                  {t('farmer.cropMilestones.prev')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.stepperNavCounterText}>
                {t('farmer.cropMilestones.counter', { number: selectedIndex + 1, total: totalCount })}
              </Text>

              <TouchableOpacity
                style={[
                  styles.stepperNavBtn,
                  selectedIndex >= totalCount - 1 && styles.stepperNavBtnDisabled,
                ]}
                disabled={selectedIndex >= totalCount - 1}
                onPress={() => {
                  if (selectedIndex < totalCount - 1) {
                    const nextMilestone = milestones[selectedIndex + 1];
                    if (nextMilestone) setSelectedMilestoneId(nextMilestone.id);
                  }
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.cropMilestones.nextA11y')}
              >
                <Text
                  style={[
                    styles.stepperNavBtnText,
                    selectedIndex >= totalCount - 1 && styles.stepperNavBtnTextDisabled,
                  ]}
                >
                  {t('farmer.cropMilestones.next')}
                </Text>
                <ChevronRightIcon
                  size={16}
                  color={selectedIndex >= totalCount - 1 ? P.twGray300 : P.twGreen700}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
    backgroundColor: P.white,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appBarTitleCol: {
    flex: 1,
  },
  appBarTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
  },
  appBarSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 1,
    fontWeight: '500',
  },
  summaryBadge: {
    backgroundColor: P.twGreen50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGreen300,
  },
  summaryBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGreen800,
  },
  scrollView: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bannerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTitleCol: {
    flex: 1,
  },
  bannerCropTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.2,
  },
  bannerCropSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  bannerPercentBadge: {
    backgroundColor: P.twGreen50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: P.twGreen300,
  },
  bannerPercentText: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: P.twGreen800,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: P.twGray200,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: P.brandGreen,
    borderRadius: 3,
  },
  bannerFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerFooterText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGreen800,
  },
  bannerFooterSub: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
  },
  stepperContainerCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 14,
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tabsContainer: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: P.white,
    borderWidth: 1.2,
    borderColor: P.twGray200,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonAchieved: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen100,
  },
  tabButtonSelected: {
    backgroundColor: P.brandGreen,
    borderColor: P.brandGreen,
    shadowColor: P.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeAchieved: {
    backgroundColor: P.brandGreen,
  },
  tabBadgeSelected: {
    backgroundColor: P.white,
  },
  tabBadgeNumber: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.twGray600,
  },
  tabBadgeNumberSelected: {
    color: P.brandGreen,
  },
  tabLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray700,
  },
  tabLabelAchieved: {
    color: P.twGreen800,
  },
  tabLabelSelected: {
    color: P.white,
  },
  selectedMilestoneCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedMilestoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  selectedMilestoneTitleCol: {
    flex: 1,
  },
  selectedMilestoneTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 4,
  },
  milestoneDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selectedMilestoneDate: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },
  milestoneTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneNumberText: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.twGray400,
    letterSpacing: 0.5,
  },
  milestoneCategoryPill: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  milestoneCategoryText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray600,
  },
  completeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: P.twGreen50,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: P.twGreen300,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  completeActionButtonAchieved: {
    backgroundColor: P.brandGreen,
    borderColor: P.brandGreen,
  },
  completeActionButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGreen700,
  },
  completeActionButtonTextAchieved: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.white,
  },
  uncompletedCircleIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: P.twGreen600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneDeliverablesGrid: {
    gap: 10,
    marginBottom: 12,
  },
  milestoneDeliverableCard: {
    backgroundColor: P.twGray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 12,
  },
  milestoneDeliverableCardAchieved: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen100,
  },
  deliverableCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  deliverableCardLabel: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.4,
  },
  deliverableCardLabelAchieved: {
    color: P.twGreen700,
  },
  deliverableCardValue: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.ink,
    lineHeight: 19,
  },
  deliverableCardValueAchieved: {
    color: P.twGreen900,
    fontWeight: '700',
  },
  milestoneObservationCard: {
    backgroundColor: P.twGray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 12,
    marginBottom: 16,
  },
  observationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  observationHeaderTitle: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: P.twGray600,
    letterSpacing: 0.2,
  },
  observationCardText: {
    fontSize: typography.bodySmall,
    lineHeight: 18,
    color: P.twGray600,
    fontStyle: 'italic',
  },
  stepperNavControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  stepperNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: P.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  stepperNavBtnDisabled: {
    backgroundColor: P.twGray50,
    borderColor: P.twGray100,
    opacity: 0.5,
  },
  stepperNavBtnText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGreen700,
  },
  stepperNavBtnTextDisabled: {
    color: P.twGray300,
  },
  stepperNavCounterText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
  },
  bottomSpacer: {
    height: 30,
  },
  // Loading / error / update-failure states (new; theme tokens only).
  stateContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateErrorText: {
    fontSize: typography.bodySmall,
    color: P.twRed600,
    marginBottom: spacing.md,
  },
});
