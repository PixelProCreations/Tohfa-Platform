import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import {
  CROP_MILESTONES_MAP,
  CROP_PRESETS,
  type CropMilestone,
} from './CropDetailScreen';

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

function CheckCircleSolidIcon({ size = 18, color = P.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path
        d="M8 12.5l2.8 2.8L16 9.5"
        stroke={P.white}
        strokeWidth="2"
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

  // Milestone State
  const [milestones, setMilestones] = useState<CropMilestone[]>(() => getInitialMilestones(crop));

  useEffect(() => {
    setMilestones(getInitialMilestones(crop));
  }, [crop]);

  const achievedCount = milestones.filter((m) => m.status === 'achieved').length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;

  // Active or selected milestone
  const defaultSelected = milestones.find((m) => m.status === 'active') ?? milestones[0];
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    defaultSelected ? defaultSelected.id : (milestones[0]?.id ?? '')
  );

  const selectedMilestone = milestones.find((m) => m.id === selectedMilestoneId) ?? milestones[0];
  const selectedIndex = milestones.findIndex((m) => m.id === selectedMilestone?.id);

  // Toggle Completed action
  const handleToggleComplete = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus: 'active' | 'achieved' = m.status === 'achieved' ? 'active' : 'achieved';
          const updated: CropMilestone = {
            ...m,
            status: nextStatus,
          };
          if (nextStatus === 'achieved') {
            updated.actual = (m.actual && !m.actual.includes('Pending'))
              ? m.actual
              : '8.8° Brix measured (Grade A)';
          }
          return updated;
        }
        return m;
      })
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top App Bar ── */}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
              const isAchieved = m.status === 'achieved';
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
                  accessibilityLabel={`Milestone ${m.milestoneNumber}: ${m.title}`}
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
                        {m.milestoneNumber}
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
                    M{m.milestoneNumber} · {m.category || `Stage ${m.milestoneNumber}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Selected Milestone Details Card ── */}
        {selectedMilestone && (
          <View style={styles.selectedMilestoneCard}>
            {/* Header with Title, Tag & Complete Button */}
            <View style={styles.selectedMilestoneHeaderRow}>
              <View style={styles.selectedMilestoneTitleCol}>
                <View style={styles.milestoneTagRow}>
                  <Text style={styles.milestoneNumberText}>
                    MILESTONE {selectedMilestone.milestoneNumber} OF {totalCount}
                  </Text>
                  <View style={styles.milestoneCategoryPill}>
                    <Text style={styles.milestoneCategoryText}>{selectedMilestone.category}</Text>
                  </View>
                </View>

                <Text style={styles.selectedMilestoneTitle}>{selectedMilestone.title}</Text>

                <View style={styles.milestoneDateRow}>
                  <CalendarIcon size={13} color={P.twGray400} />
                  <Text style={styles.selectedMilestoneDate}>
                    Target: Day {selectedMilestone.day} · {selectedMilestone.targetDate}
                  </Text>
                </View>
              </View>

              {/* Interactive Completed Action Button */}
              <TouchableOpacity
                style={[
                  styles.completeActionButton,
                  selectedMilestone.status === 'achieved' && styles.completeActionButtonAchieved,
                ]}
                onPress={() => handleToggleComplete(selectedMilestone.id)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={
                  selectedMilestone.status === 'achieved'
                    ? 'Mark milestone as in-progress'
                    : 'Mark milestone as completed'
                }
              >
                {selectedMilestone.status === 'achieved' ? (
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
                <Text style={styles.deliverableCardValue}>{selectedMilestone.target}</Text>
              </View>

              {/* Recorded Outcome Card */}
              <View
                style={[
                  styles.milestoneDeliverableCard,
                  selectedMilestone.status === 'achieved' && styles.milestoneDeliverableCardAchieved,
                ]}
              >
                <View style={styles.deliverableCardHeader}>
                  <CheckMiniIcon
                    size={13}
                    color={selectedMilestone.status === 'achieved' ? P.twGreen700 : P.twGray400}
                  />
                  <Text
                    style={[
                      styles.deliverableCardLabel,
                      selectedMilestone.status === 'achieved' && styles.deliverableCardLabelAchieved,
                    ]}
                  >
                    RECORDED OUTCOME
                  </Text>
                </View>
                <Text
                  style={[
                    styles.deliverableCardValue,
                    selectedMilestone.status === 'achieved' && styles.deliverableCardValueAchieved,
                  ]}
                >
                  {selectedMilestone.actual ??
                    (selectedMilestone.status === 'achieved'
                      ? 'Completed & Verified'
                      : 'In Progress / Upcoming')}
                </Text>
              </View>
            </View>

            {/* Agronomist Field / Observation Note */}
            <View style={styles.milestoneObservationCard}>
              <View style={styles.observationHeaderRow}>
                <SparklesIcon size={13} color={P.twGreen700} />
                <Text style={styles.observationHeaderTitle}>Field Observation</Text>
              </View>
              <Text style={styles.observationCardText}>“{selectedMilestone.note}”</Text>
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
    fontSize: 17,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
  },
  appBarSubtitle: {
    fontSize: 12,
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
    fontSize: 11.5,
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
    fontSize: 16,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.2,
  },
  bannerCropSubtitle: {
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGreen800,
  },
  bannerFooterSub: {
    fontSize: 11.5,
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
    fontSize: 11,
    fontWeight: '800',
    color: P.twGray600,
  },
  tabBadgeNumberSelected: {
    color: P.brandGreen,
  },
  tabLabel: {
    fontSize: 12,
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
    fontSize: 17,
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
    fontSize: 12,
    color: P.twGray500,
    fontWeight: '500',
  },
  milestoneTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneNumberText: {
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 12,
    fontWeight: '700',
    color: P.twGreen700,
  },
  completeActionButtonTextAchieved: {
    fontSize: 12,
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
    fontSize: 10,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.4,
  },
  deliverableCardLabelAchieved: {
    color: P.twGreen700,
  },
  deliverableCardValue: {
    fontSize: 13.5,
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
    fontSize: 11,
    fontWeight: '800',
    color: P.twGray600,
    letterSpacing: 0.2,
  },
  observationCardText: {
    fontSize: 12.5,
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
    fontSize: 12,
    fontWeight: '700',
    color: P.twGreen700,
  },
  stepperNavBtnTextDisabled: {
    color: P.twGray300,
  },
  stepperNavCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
  },
  bottomSpacer: {
    height: 30,
  },
});
