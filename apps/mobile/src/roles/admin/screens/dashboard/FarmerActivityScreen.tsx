import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 1. Tomato Produce Outline Icon (Today card 1)
function TomatoProduceIcon({
  size = 22,
  color = adminColors.warning.text,
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === adminColors.onBrand.toLowerCase();
  const resolvedLeafColor = leafColor ?? (isWhite ? color : adminColors.muted);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="5.8" stroke={color} strokeWidth="2.2" />
      <Path
        d="M12 8.2c.3-1.8 1.1-3 2.3-3.6"
        stroke={resolvedLeafColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M11.8 8.2C11.6 5.8 9.6 4.2 7.8 4.8c-.3 2.1 1.5 3.6 4 3.4z"
        fill={resolvedLeafColor}
      />
    </Svg>
  );
}

// 2. Eye Icon (Today card 2: Farmer Profile Viewed)
function EyeViewIcon({ size = 22, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// 3. Serrated Badge Checkmark Icon (Yesterday: Audit Completed)
function BadgeCheckIcon({ size = 22, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 2.1 3.2-.4 1.4 2.9 2.9 1.4-.4 3.2 2.1 2.4-2.1 2.4.4 3.2-2.9 1.4-1.4 2.9-3.2-.4L12 22l-2.4-2.1-3.2.4-1.4-2.9-2.9-1.4.4-3.2-2.1-2.4 2.1-2.4-.4-3.2 2.9-1.4 1.4-2.9 3.2.4L12 2z"
        stroke={color}
        strokeWidth="1.6"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 4. Star Outline Icon (25 Sep: Rating Updated)
function StarOutlineIcon({ size = 22, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l2.9 6.2 6.8.9-5 4.8 1.3 6.8-6-3.3-6 3.3 1.3-6.8-5-4.8 6.8-.9L12 2.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface ActivityItem {
  id: string;
  type: string;
  referenceId: string;
  category: 'Produce' | 'Audit' | 'Rating' | 'Dispute' | 'Community' | 'Support';
  dateTime: string;
  subtitle: string;
  dateGroup: 'TODAY' | 'YESTERDAY' | '25 SEP';
  status: string;
  actor: string;
  isSimpleDetail?: boolean;
}

export interface FarmerActivityScreenProps {
  farmerName?: string;
  farmerId?: string;
  onBack: () => void;
  onNavigateProduceListing?: (listingId: string) => void;
}

export function FarmerActivityScreen({
  farmerName,
  farmerId,
  onBack,
  onNavigateProduceListing,
}: FarmerActivityScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('Today');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Category scrollbar dynamic tracking
  const categoryScrollRef = useRef<ScrollView>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(240);
  const maxScrollWidthRef = useRef(300);

  const categories = ['All', 'Produce', 'Audit', 'Rating', 'Dispute', 'Community', 'Support'];
  const timeFilters: Array<'Today' | 'This Week' | 'This Month' | 'Custom'> = ['Today', 'This Week', 'This Month', 'Custom'];

  const activities: ActivityItem[] = [
    {
      id: 'act-1',
      type: 'Produce Listing Submitted',
      referenceId: 'PL-001245',
      category: 'Produce',
      dateTime: 'Today, 10:24 AM',
      subtitle: 'Tomato — Grade 1 · 10:24 AM',
      dateGroup: 'TODAY',
      status: 'Pending Review',
      actor: farmerName ? `Farmer (${farmerName})` : 'Farmer',
      isSimpleDetail: true,
    },
    {
      id: 'act-2',
      type: 'Farmer Profile Viewed',
      referenceId: '—',
      category: 'Community',
      dateTime: 'Today, 10:24 AM',
      subtitle: '09:15 AM',
      dateGroup: 'TODAY',
      status: 'Pending Review',
      actor: 'System',
      isSimpleDetail: false,
    },
    {
      id: 'act-3',
      type: 'Audit Completed',
      referenceId: 'AUD-00125',
      category: 'Audit',
      dateTime: 'Yesterday, 04:30 PM',
      subtitle: 'Farm Audit #AUD-00125',
      dateGroup: 'YESTERDAY',
      status: 'Completed',
      actor: 'Farmer Admin (Suresh)',
      isSimpleDetail: false,
    },
    {
      id: 'act-4',
      type: 'Rating Updated',
      referenceId: 'RAT-00042',
      category: 'Rating',
      dateTime: 'Today, 10:24 AM',
      subtitle: 'Overall rating changed to 4.6',
      dateGroup: '25 SEP',
      status: 'Pending Review',
      actor: 'System',
      isSimpleDetail: false,
    },
  ];

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedCategory !== 'All' && act.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [activities, selectedCategory]);

  const handleCategoryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    maxScrollWidthRef.current = maxScroll;
    if (maxScroll > 0) {
      setScrollProgress(Math.max(0, Math.min(1, contentOffset.x / maxScroll)));
    }
  };

  const thumbWidth = 70;
  const maxThumbTranslate = Math.max(0, trackWidth - thumbWidth);
  const thumbLeft = scrollProgress * maxThumbTranslate;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const available = trackWidth - thumbWidth;
        if (available > 0) {
          const ratio = Math.max(0, Math.min(1, gestureState.dx / available));
          setScrollProgress(ratio);
          categoryScrollRef.current?.scrollTo({
            x: ratio * maxScrollWidthRef.current,
            animated: false,
          });
        }
      },
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const available = trackWidth - thumbWidth;
        if (available > 0) {
          const ratio = Math.max(0, Math.min(1, (touchX - thumbWidth / 2) / available));
          setScrollProgress(ratio);
          categoryScrollRef.current?.scrollTo({
            x: ratio * maxScrollWidthRef.current,
            animated: true,
          });
        }
      },
    })
  ).current;

  // Detail view
  if (selectedActivity) {
    const isSimple = selectedActivity.isSimpleDetail;

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelectedActivity(null)}
              activeOpacity={0.7}
              accessibilityLabel="Back to Activity"
            >
              <BackArrowIcon size={24} color={adminColors.onBrand} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{t('farmerActivity.detail.title')}</Text>
              {!isSimple && (farmerName || farmerId) ? (
                <Text style={styles.headerSubDetail}>
                  {farmerName ?? ''}{farmerName && farmerId ? ' · ' : ''}{farmerId ?? ''}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailsCard}>
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Activity Type</Text>
                <Text style={styles.valBold}>{selectedActivity.type}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Reference ID</Text>
                <Text style={styles.valBold}>{selectedActivity.referenceId}</Text>
              </View>
            </View>

            {!isSimple && (
              <>
                <View style={[styles.rowTwoCol, styles.rowSpacing]}>
                  <View style={styles.colHalf}>
                    <Text style={styles.labelMuted}>Date/Time</Text>
                    <Text style={styles.valBold}>{selectedActivity.dateTime}</Text>
                  </View>
                  <View style={styles.colHalf}>
                    <Text style={styles.labelMuted}>Related Farmer</Text>
                    <Text style={styles.valBold}>{farmerName || '—'}</Text>
                  </View>
                </View>

                <View style={[styles.rowTwoCol, styles.rowSpacing]}>
                  <View style={styles.colHalf}>
                    <Text style={styles.labelMuted}>Status</Text>
                    <Text style={styles.valBold}>{selectedActivity.status}</Text>
                  </View>
                  <View style={styles.colHalf}>
                    <Text style={styles.labelMuted}>Actor</Text>
                    <Text style={styles.valBold}>{selectedActivity.actor}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {!isSimple && (
            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => {
                if (selectedActivity.type === 'Produce Listing Submitted') {
                  onNavigateProduceListing?.('PL-001245');
                } else {
                  Alert.alert('Related Record', `Opening details for ${selectedActivity.referenceId}.`);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionBtnText}>View Related Record</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.outlineActionBtn, !isSimple && styles.rowSpacing]}
            onPress={() => setSelectedActivity(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineActionBtnText}>Back to Activity</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main timeline view
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('farmerActivity.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Row 1: Category Chips */}
        <View style={styles.categoryRowWrap}>
          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
            onScroll={handleCategoryScroll}
            scrollEventThrottle={16}
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, active ? styles.categoryChipActive : styles.categoryChipInactive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Slider track below category chips */}
          <View
            style={styles.sliderBarWrap}
            onLayout={(e: LayoutChangeEvent) => {
              setTrackWidth(e.nativeEvent.layout.width - 44);
            }}
          >
            <TouchableOpacity
              onPress={() => categoryScrollRef.current?.scrollTo({ x: 0, animated: true })}
              activeOpacity={0.7}
              style={styles.sliderArrowTouch}
            >
              <Text style={styles.sliderArrowText}>◀</Text>
            </TouchableOpacity>

            <View
              style={styles.sliderTrack}
              {...panResponder.panHandlers}
            >
              <View
                style={[
                  styles.sliderThumb,
                  {
                    width: thumbWidth,
                    transform: [{ translateX: thumbLeft }],
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={() => categoryScrollRef.current?.scrollToEnd({ animated: true })}
              activeOpacity={0.7}
              style={styles.sliderArrowTouch}
            >
              <Text style={styles.sliderArrowText}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Time Filter Pills */}
        <View style={styles.timePillsRow}>
          {timeFilters.map((tf) => {
            const active = selectedTimeFilter === tf;
            return (
              <TouchableOpacity
                key={tf}
                style={[styles.timePill, active ? styles.timePillActive : styles.timePillInactive]}
                onPress={() => setSelectedTimeFilter(tf)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timePillText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                  {tf}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Grouped Activity Cards */}
        {(['TODAY', 'YESTERDAY', '25 SEP'] as const).map((group) => {
          const groupItems = filteredActivities.filter((a) => a.dateGroup === group);
          if (groupItems.length === 0) return null;

          return (
            <React.Fragment key={group}>
              <Text style={styles.dateGroupHeader}>{group}</Text>
              {groupItems.map((act) => {
                let icon = <TomatoProduceIcon size={22} color={adminColors.warning.text} />;
                if (act.type === 'Farmer Profile Viewed') {
                  icon = <EyeViewIcon size={22} color={adminColors.muted} />;
                } else if (act.type === 'Audit Completed') {
                  icon = <BadgeCheckIcon size={22} color={adminColors.success.text} />;
                } else if (act.type === 'Rating Updated') {
                  icon = <StarOutlineIcon size={22} color={adminColors.warning.text} />;
                }

                return (
                  <TouchableOpacity
                    key={act.id}
                    style={styles.activityCard}
                    onPress={() => setSelectedActivity(act)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.activityIconCol}>{icon}</View>
                    <View style={styles.activityTextCol}>
                      <Text style={styles.activityTitle}>{act.type}</Text>
                      <Text style={styles.activitySubtitle}>{act.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </React.Fragment>
          );
        })}

        {filteredActivities.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No {selectedCategory.toLowerCase()} activities recorded for this period.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubDetail: {
    ...adminType.rowMeta,
    color: adminColors.brandTint,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },

  // Category chips
  categoryRowWrap: {
    marginBottom: adminSpacing.xs,
  },
  chipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  categoryChipInactive: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.border,
  },
  categoryChipText: {
    ...adminType.body,
    fontWeight: '700',
  },
  chipTextActive: {
    color: adminColors.onBrand,
  },
  chipTextInactive: {
    color: adminColors.ink,
  },

  // Slider track
  sliderBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  sliderArrowTouch: {
    paddingHorizontal: 3,
  },
  sliderArrowText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  sliderTrack: {
    flex: 1,
    height: 5,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.xs,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderThumb: {
    height: 5,
    backgroundColor: adminColors.muted,
    borderRadius: adminRadius.xs,
  },

  // Time filter pills
  timePillsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  timePill: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
  },
  timePillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  timePillInactive: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.border,
  },
  timePillText: {
    ...adminType.caption,
    fontWeight: '700',
  },

  // Date groups
  dateGroupHeader: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  activityIconCol: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  activityTextCol: {
    flex: 1,
    paddingLeft: adminSpacing.xs,
  },
  activityTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activitySubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },

  // Activity Detail
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  rowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowSpacing: {
    marginTop: adminSpacing.lg,
  },
  colHalf: {
    width: '48%',
  },
  labelMuted: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  valBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  outlineActionBtn: {
    height: 48,
    backgroundColor: adminColors.canvas,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  emptyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.xl,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
