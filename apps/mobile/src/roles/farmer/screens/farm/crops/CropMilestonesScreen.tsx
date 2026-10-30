import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
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
import { authPalette as P, typography } from '../../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import {
  CROP_MILESTONES_MAP,
  CROP_PRESETS,
  type CropMilestone,
} from './CropDetailScreen';
import {
  listCropMilestones,
  listCropMilestoneTemplates,
  updateCropMilestone,
  type CropMilestoneResponse,
  type CropMilestonesListResponse,
  type CropMilestoneTemplateResponse,
  type MilestoneStatus,
  type UpdateCropMilestoneRequest,
} from '../../../api/crops';


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatCategory(stageCode: string): string {
  if (!stageCode) return 'Milestone';
  const clean = stageCode.startsWith('STAGE_') ? stageCode.replace('STAGE_', '') : stageCode;
  return clean
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}


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

interface DisplayMilestone {
  id: string;
  sequenceOrder: number;
  stageCode: string;
  title: string;
  category: string;
  status: MilestoneStatus;
  targetDate: string | null;
  completedOn: string | null;
  expectedDays: number;
  targetDeliverable: string;
  recordedOutcome: string;
  note: string | null;
}

function getInitialMilestones(crop?: CropItem | null): CropMilestone[] {
  if (!crop) return CROP_MILESTONES_MAP?.carrot ?? [];
  const key = (crop.cropType ?? crop.name ?? 'carrot').toLowerCase();
  if (CROP_MILESTONES_MAP) {
    for (const [name, milestones] of Object.entries(CROP_MILESTONES_MAP)) {
      if (key.includes(name)) return milestones;
    }
  }
  return CROP_MILESTONES_MAP?.carrot ?? [];
}

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

  const preset = crop
    ? (CROP_PRESETS?.[crop.cropType?.toLowerCase() ?? 'carrot'] ?? CROP_PRESETS?.carrot)
    : CROP_PRESETS?.carrot;
  const title = crop ? `${crop.name} — ${crop.variety}` : `Carrot — ${preset?.defaultVariety ?? 'Nantes'}`;
  const subtitle = crop
    ? `${crop.zone} · Expected ${preset?.expectedHarvest ?? '20 Jul 2026'}`
    : `Zone 1 — Upper Field · Expected ${preset?.expectedHarvest ?? '20 Jul 2026'}`;
  const daysOld = crop?.daysOld ?? 88;

  // States
  const [loading, setLoading] = useState<boolean>(Boolean(crop?.id));
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Live API data
  const [apiMilestones, setApiMilestones] = useState<CropMilestonesListResponse | null>(null);
  const [templates, setTemplates] = useState<CropMilestoneTemplateResponse[]>([]);

  // Fallback for mock preview without real crop.id
  const [fallbackMilestones, setFallbackMilestones] = useState<CropMilestone[]>(() =>
    getInitialMilestones(crop),
  );

  const loadData = useCallback(async (isRefresh = false) => {
    if (!crop?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const [milestonesRes, templatesRes] = await Promise.all([
        listCropMilestones(crop.id),
        listCropMilestoneTemplates(),
      ]);
      setApiMilestones(milestonesRes);
      setTemplates(templatesRes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load milestones';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [crop?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const templateMap = useMemo(() => {
    const map = new Map<string, CropMilestoneTemplateResponse>();
    for (const t of templates) {
      map.set(t.id, t);
      map.set(t.stageCode, t);
    }
    return map;
  }, [templates]);

  const milestones: DisplayMilestone[] = useMemo(() => {
    if (apiMilestones && apiMilestones.items) {
      return apiMilestones.items.map((m) => {
        const template = (m.templateId ? templateMap.get(m.templateId) : null) ?? templateMap.get(m.stageCode);
        const isAchieved = m.status === 'COMPLETED';
        return {
          id: m.id,
          sequenceOrder: m.sequenceOrder,
          stageCode: m.stageCode,
          title: m.stageName,
          category: formatCategory(m.stageCode),
          status: m.status,
          targetDate: m.targetDate,
          completedOn: m.completedOn,
          expectedDays: template?.expectedDaysAfterPlanting ?? (m.sequenceOrder * 15),
          targetDeliverable:
            template?.description || `${m.stageName} stage criteria met`,
          recordedOutcome: isAchieved
            ? (m.completedOn ? `Completed on ${formatDate(m.completedOn)}` : 'Completed & Verified')
            : 'In Progress / Upcoming',
          note: m.notes,
        };
      });
    }

    return fallbackMilestones.map((m) => ({
      id: m.id,
      sequenceOrder: m.milestoneNumber,
      stageCode: m.category,
      title: m.title,
      category: m.category,
      status: (m.status === 'achieved' ? 'COMPLETED' : 'PENDING') as MilestoneStatus,
      targetDate: m.targetDate,
      completedOn: m.status === 'achieved' ? m.targetDate : null,
      expectedDays: m.day,
      targetDeliverable: m.target,
      recordedOutcome: m.actual ?? (m.status === 'achieved' ? 'Completed & Verified' : 'In Progress / Upcoming'),
      note: m.note,
    }));
  }, [apiMilestones, templateMap, fallbackMilestones]);

  const achievedCount = apiMilestones
    ? apiMilestones.completedCount
    : milestones.filter((m) => m.status === 'COMPLETED').length;
  const totalCount = apiMilestones
    ? apiMilestones.totalCount
    : milestones.length;
  const progressPercent = apiMilestones
    ? Math.round(apiMilestones.progressPct)
    : (totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0);

  // Selected milestone
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');

  useEffect(() => {
    if (milestones.length > 0) {
      setSelectedMilestoneId((prev) => {
        if (prev && milestones.some((m) => m.id === prev)) {
          return prev;
        }
        const firstPending = milestones.find((m) => m.status === 'PENDING');
        return firstPending ? firstPending.id : milestones[0]!.id;
      });
    }
  }, [milestones]);

  const selectedMilestone = milestones.find((m) => m.id === selectedMilestoneId) ?? milestones[0];
  const selectedIndex = selectedMilestone
    ? milestones.findIndex((m) => m.id === selectedMilestone.id)
    : -1;

  // Toggle Completed action
  const handleToggleComplete = async (m: DisplayMilestone) => {
    if (togglingId) return;

    const isCurrentlyCompleted = m.status === 'COMPLETED';
    const nextStatus: MilestoneStatus = isCurrentlyCompleted ? 'PENDING' : 'COMPLETED';

    if (crop?.id && apiMilestones) {
      setTogglingId(m.id);

      // Optimistic update
      const prevData = apiMilestones;
      const updatedItems = prevData.items.map((item) => {
        if (item.id === m.id) {
          return {
            ...item,
            status: nextStatus,
            completedOn: nextStatus === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : null,
          };
        }
        return item;
      });
      const newCompletedCount = updatedItems.filter((i) => i.status === 'COMPLETED').length;
      const newTotal = updatedItems.length;
      const newProgress = newTotal > 0 ? Math.round((newCompletedCount / newTotal) * 100) : 0;

      setApiMilestones({
        items: updatedItems,
        totalCount: newTotal,
        completedCount: newCompletedCount,
        progressPct: newProgress,
      });

      try {
        const updatePayload: UpdateCropMilestoneRequest = {
          status: nextStatus,
        };
        if (nextStatus === 'PENDING') {
          updatePayload.completedOn = null;
        }
        const res = await updateCropMilestone(crop.id, m.id, updatePayload);

        // Sync with server returned record
        setApiMilestones((current) => {
          if (!current) return current;
          const syncedItems = current.items.map((item) => (item.id === m.id ? res : item));
          const completed = syncedItems.filter((i) => i.status === 'COMPLETED').length;
          const total = syncedItems.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return {
            items: syncedItems,
            totalCount: total,
            completedCount: completed,
            progressPct: pct,
          };
        });
      } catch (err: unknown) {
        // Rollback on error
        setApiMilestones(prevData);
        const message = err instanceof Error ? err.message : 'Failed to update milestone status';
        setError(message);
      } finally {
        setTogglingId(null);
      }
    } else {
      // Fallback local update
      setFallbackMilestones((prev) =>
        prev.map((item) => {
          if (item.id === m.id) {
            const nextLocalStatus = item.status === 'achieved' ? 'active' : 'achieved';
            return {
              ...item,
              status: nextLocalStatus,
              actual: nextLocalStatus === 'achieved' ? 'Completed & Verified' : 'In Progress / Upcoming',
            };
          }
          return item;
        }),
      );
    }
  };

  const renderHeader = () => (
    <View style={styles.topAppBar}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowBackIcon size={20} color={P.ink} />
      </TouchableOpacity>

      <View style={styles.appBarTitleCol}>
        <Text style={styles.appBarTitle}>Crop Milestones</Text>
        <Text style={styles.appBarSubtitle}>{title}</Text>
      </View>

      <View style={styles.summaryBadge}>
        <Text style={styles.summaryBadgeText}>
          {achievedCount}/{totalCount} Done
        </Text>
      </View>
    </View>
  );

  if (loading && !apiMilestones) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={120} borderRadius={18} />
          <View style={styles.skeletonSpacer} />
          <Skeleton width="100%" height={48} borderRadius={24} />
          <View style={styles.skeletonSpacer} />
          <Skeleton width="100%" height={320} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !apiMilestones) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <ErrorState
            title="Failed to Load Milestones"
            message={error}
            retryTitle="Retry"
            onRetry={() => {
              loadData();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top App Bar ── */}
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData(true);
            }}
            colors={[P.brandGreen]}
            tintColor={P.brandGreen}
          />
        }
      >
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
              {achievedCount} of {totalCount} milestones completed
            </Text>
            <Text style={styles.bannerFooterSub}>Day {daysOld} of crop lifecycle</Text>
          </View>
        </View>

        {/* ── Horizontal Milestone Tabs ── */}
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
                  accessibilityLabel={`Milestone ${m.sequenceOrder}: ${m.title}`}
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
                    M{m.sequenceOrder} · {m.category || `Stage ${m.sequenceOrder}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Selected Milestone Details Card ── */}
        {selectedMilestone ? (
          <View style={styles.selectedMilestoneCard}>
            {/* Header with Title, Tag & Complete Button */}
            <View style={styles.selectedMilestoneHeaderRow}>
              <View style={styles.selectedMilestoneTitleCol}>
                <View style={styles.milestoneTagRow}>
                  <Text style={styles.milestoneNumberText}>
                    MILESTONE {selectedMilestone.sequenceOrder} OF {totalCount}
                  </Text>
                  <View style={styles.milestoneCategoryPill}>
                    <Text style={styles.milestoneCategoryText}>{selectedMilestone.category}</Text>
                  </View>
                </View>

                <Text style={styles.selectedMilestoneTitle}>{selectedMilestone.title}</Text>

                <View style={styles.milestoneDateRow}>
                  <CalendarIcon size={13} color={P.twGray400} />
                  <Text style={styles.selectedMilestoneDate}>
                    Target: Day {selectedMilestone.expectedDays}
                    {selectedMilestone.targetDate
                      ? ` · ${formatDate(selectedMilestone.targetDate)}`
                      : ''}
                  </Text>
                </View>
              </View>

              {/* Interactive Completed Action Button */}
              <TouchableOpacity
                style={[
                  styles.completeActionButton,
                  selectedMilestone.status === 'COMPLETED' && styles.completeActionButtonAchieved,
                  togglingId === selectedMilestone.id && { opacity: 0.7 },
                ]}
                onPress={() => handleToggleComplete(selectedMilestone)}
                disabled={togglingId === selectedMilestone.id}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={
                  selectedMilestone.status === 'COMPLETED'
                    ? 'Mark milestone as in-progress'
                    : 'Mark milestone as completed'
                }
              >
                {togglingId === selectedMilestone.id ? (
                  <ActivityIndicator
                    size="small"
                    color={selectedMilestone.status === 'COMPLETED' ? P.white : P.twGreen700}
                  />
                ) : selectedMilestone.status === 'COMPLETED' ? (
                  <>
                    <CheckMiniIcon size={14} color={P.white} />
                    <Text style={styles.completeActionButtonTextAchieved}>Completed</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.uncompletedCircleIcon}>
                      <CheckMiniIcon size={10} color={P.twGreen700} />
                    </View>
                    <Text style={styles.completeActionButtonText}>Mark Done</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Target vs Actual Deliverables Grid */}
            <View style={styles.milestoneDeliverablesGrid}>
              {/* Target Card */}
              <View style={styles.milestoneDeliverableCard}>
                <View style={styles.deliverableCardHeader}>
                  <TargetMetricIcon size={13} color={P.twGray500} />
                  <Text style={styles.deliverableCardLabel}>TARGET DELIVERABLE</Text>
                </View>
                <Text style={styles.deliverableCardValue}>{selectedMilestone.targetDeliverable}</Text>
              </View>

              {/* Recorded Outcome Card */}
              <View
                style={[
                  styles.milestoneDeliverableCard,
                  selectedMilestone.status === 'COMPLETED' && styles.milestoneDeliverableCardAchieved,
                ]}
              >
                <View style={styles.deliverableCardHeader}>
                  <CheckMiniIcon
                    size={13}
                    color={selectedMilestone.status === 'COMPLETED' ? P.twGreen700 : P.twGray400}
                  />
                  <Text
                    style={[
                      styles.deliverableCardLabel,
                      selectedMilestone.status === 'COMPLETED' && styles.deliverableCardLabelAchieved,
                    ]}
                  >
                    RECORDED OUTCOME
                  </Text>
                </View>
                <Text
                  style={[
                    styles.deliverableCardValue,
                    selectedMilestone.status === 'COMPLETED' && styles.deliverableCardValueAchieved,
                  ]}
                >
                  {selectedMilestone.recordedOutcome}
                </Text>
              </View>
            </View>

            {/* Agronomist Field / Observation Note */}
            <View style={styles.milestoneObservationCard}>
              <View style={styles.observationHeaderRow}>
                <SparklesIcon size={13} color={P.twGreen700} />
                <Text style={styles.observationHeaderTitle}>Field Observation</Text>
              </View>
              <Text style={styles.observationCardText}>
                {selectedMilestone.note
                  ? `“${selectedMilestone.note}”`
                  : '“No field observation recorded for this milestone.”'}
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
                accessibilityLabel="Previous milestone"
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
                  Prev
                </Text>
              </TouchableOpacity>

              <Text style={styles.stepperNavCounterText}>
                Milestone {selectedIndex + 1} of {totalCount}
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
                accessibilityLabel="Next milestone"
              >
                <Text
                  style={[
                    styles.stepperNavBtnText,
                    selectedIndex >= totalCount - 1 && styles.stepperNavBtnTextDisabled,
                  ]}
                >
                  Next
                </Text>
                <ChevronRightIcon
                  size={16}
                  color={selectedIndex >= totalCount - 1 ? P.twGray300 : P.twGreen700}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No growth milestones recorded for this crop.</Text>
          </View>
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
  loadingContainer: {
    padding: 16,
  },
  skeletonSpacer: {
    height: 14,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.body,
    color: P.twGray500,
    textAlign: 'center',
  },
});

