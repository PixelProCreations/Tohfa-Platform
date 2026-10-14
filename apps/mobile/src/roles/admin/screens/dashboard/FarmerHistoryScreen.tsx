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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';
import { FarmerRatingsScreen } from './FarmerRatingsScreen';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',
  brandOrange: adminColors.brand,
  titleRustDark: adminColors.brandDeep,
  greenIcon: adminColors.success.text,
  amberIcon: adminColors.warning.text,
  moduleBrownBtn: adminColors.brandDeep,
};

// ─── SVG Icons Matching Exact Design ─────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

// 1. Tomato / Produce outline icon
function TomatoProduceIcon({
  size = 22,
  color = THEME.amberIcon,
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === '#ffffff' || color?.toLowerCase() === '#fff';
  const resolvedLeafColor = leafColor ?? (isWhite ? color : '#5C6B63');

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

// 2. Rosette badge check icon
function BadgeCheckIcon({ size = 22, color = THEME.greenIcon }: { size?: number; color?: string }) {
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

// 3. Document icon with folded corner
function DocumentViewIcon({ size = 22, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M9 13h6M9 17h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 4. Star outline icon
function StarOutlineIcon({ size = 22, color = THEME.amberIcon }: { size?: number; color?: string }) {
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

// 5. Circle checkmark icon (Produce listing approved)
function CircleCheckIcon({ size = 22, color = THEME.greenIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path
        d="M8.5 12l2.5 2.5 5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface HistoryItem {
  id: string;
  event: string;
  date: string;
  fullDate: string;
  reference: string;
  status: string;
  category: 'Profile' | 'Farm' | 'Produce' | 'Audit' | 'Rating';
  targetModuleNote?: string;
  targetModuleLabel?: string;
  navigateToRatings?: boolean;
}

export interface FarmerHistoryScreenProps {
  farmerName?: string;
  farmerId?: string;
  onBack: () => void;
  onNavigateFarmerRatings?: () => void;
}

export function FarmerHistoryScreen({
  farmerName = 'Ramesh Kumar',
  farmerId = 'FR-00124',
  onBack,
  onNavigateFarmerRatings,
}: FarmerHistoryScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
  const [showRatingsScreen, setShowRatingsScreen] = useState<boolean>(false);

  // Category scrollbar dynamic tracking
  const categoryScrollRef = useRef<ScrollView>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(240);
  const maxScrollWidthRef = useRef(300);

  const categories = ['All', 'Profile', 'Farm', 'Produce', 'Audit', 'Rating'];

  const historyItems: HistoryItem[] = [
    {
      id: 'hist-1',
      event: 'Produce listing submitted',
      date: '28 Sep',
      fullDate: '28 Sep 2026',
      reference: 'PL-001245',
      status: 'Recorded',
      category: 'Produce',
      targetModuleLabel: 'Opens Module 3 — Produce Listing Detail',
      targetModuleNote: 'Opens Module 3 — Produce Listing Detail (Module 3 not started yet — will link upon module launch)',
    },
    {
      id: 'hist-2',
      event: 'Farm audit completed',
      date: '25 Sep',
      fullDate: '28 Sep 2026',
      reference: 'AUD-00125',
      status: 'Recorded',
      category: 'Audit',
      targetModuleLabel: 'Opens Audit Management',
      targetModuleNote: 'Opens Audit Management (Module not started yet — will link upon module launch)',
    },
    {
      id: 'hist-3',
      event: 'Certification document viewed',
      date: '20 Sep',
      fullDate: '28 Sep 2026',
      reference: 'DOC-00125',
      status: 'Recorded',
      category: 'Farm',
    },
    {
      id: 'hist-4',
      event: 'Farmer rating updated',
      date: '12 Sep',
      fullDate: '28 Sep 2026',
      reference: 'RAT-00042',
      status: 'Recorded',
      category: 'Rating',
      targetModuleLabel: 'Opens Farmer Ratings',
      navigateToRatings: true,
    },
    {
      id: 'hist-5',
      event: 'Produce listing approved',
      date: '05 Sep',
      fullDate: '28 Sep 2026',
      reference: 'PL-001230',
      status: 'Recorded',
      category: 'Produce',
      targetModuleLabel: 'Opens Module 3 — Produce Listing Detail',
      targetModuleNote: 'Opens Module 3 — Produce Listing Detail (Module 3 not started yet — will link upon module launch)',
    },
  ];

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return historyItems;
    return historyItems.filter((item) => item.category === selectedCategory);
  }, [historyItems, selectedCategory]);

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

  // Pan responder to allow touching and moving category scrollbar directly
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

  // ─── IF NAVIGATING TO FARMER RATINGS (Mockup 1) ───
  if (showRatingsScreen) {
    return (
      <FarmerRatingsScreen
        farmerName={farmerName}
        farmerId={farmerId}
        onBack={() => setShowRatingsScreen(false)}
      />
    );
  }

  // ─── IF A HISTORY ITEM IS SELECTED: SHOW HISTORY DETAIL (Images 3, 4, 5) ───
  if (selectedHistory) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* Terracotta Header: ← History Detail */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelectedHistory(null)}
              activeOpacity={0.7}
              accessibilityLabel="Back to History"
            >
              <BackArrowIcon size={24} color={THEME.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>History Detail</Text>
              <Text style={styles.headerSubDetail}>{farmerName} · {farmerId}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPadDetail}
          showsVerticalScrollIndicator={false}
        >
          {/* Detail Card (Images 3, 4, 5) */}
          <View style={styles.detailsCard}>
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Event</Text>
                <Text style={styles.valBold}>{selectedHistory.event}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Date</Text>
                <Text style={styles.valBold}>{selectedHistory.fullDate}</Text>
              </View>
            </View>

            <View style={[styles.rowTwoCol, { marginTop: 18 }]}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Reference</Text>
                <Text style={styles.valBold}>{selectedHistory.reference}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>Status</Text>
                <Text style={styles.valBold}>{selectedHistory.status}</Text>
              </View>
            </View>
          </View>

          {/* Action: Back to History */}
          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => setSelectedHistory(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineActionBtnText}>Back to History</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN FARMER HISTORY TIMELINE VIEW (Image 2) ───
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* Terracotta Header: ← Farmer History */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer History</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter Chips with Interactive Slider */}
        <View style={{ marginBottom: 16 }}>
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

        {/* Year Section Header (Image 2) */}
        <Text style={styles.yearHeader}>2026</Text>

        {/* History Cards (Image 2) */}
        {filteredItems.map((item) => {
          let icon = <TomatoProduceIcon size={22} color={THEME.amberIcon} />;
          if (item.event === 'Farm audit completed') {
            icon = <BadgeCheckIcon size={22} color={THEME.greenIcon} />;
          } else if (item.event === 'Certification document viewed') {
            icon = <DocumentViewIcon size={22} color="#6B7280" />;
          } else if (item.event === 'Farmer rating updated') {
            icon = <StarOutlineIcon size={22} color={THEME.amberIcon} />;
          } else if (item.event === 'Produce listing approved') {
            icon = <CircleCheckIcon size={22} color={THEME.greenIcon} />;
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.historyCard}
              onPress={() => setSelectedHistory(item)}
              activeOpacity={0.75}
            >
              <View style={styles.historyIconCol}>{icon}</View>
              <View style={styles.historyTextCol}>
                <Text style={styles.historyTitle}>{item.event}</Text>
                <Text style={styles.historySubtitle}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  headerSubDetail: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  scrollPadDetail: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },

  // Category chips
  chipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: THEME.brandOrange,
    borderColor: THEME.brandOrange,
  },
  categoryChipInactive: {
    backgroundColor: THEME.card,
    borderColor: THEME.border,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: THEME.white,
  },
  chipTextInactive: {
    color: THEME.ink,
  },

  // Slider track
  sliderBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  sliderArrowTouch: {
    paddingHorizontal: 3,
  },
  sliderArrowText: {
    fontSize: 11,
    color: '#8A8580',
  },
  sliderTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#E5DFD7',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderThumb: {
    height: 5,
    backgroundColor: '#8A8580',
    borderRadius: 3,
  },

  // Year Section Header
  yearHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78716C',
    letterSpacing: 0.3,
    marginBottom: 10,
  },

  // History Card (Image 2)
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  historyIconCol: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  historyTextCol: {
    flex: 1,
    paddingLeft: 4,
  },
  historyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  historySubtitle: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 3,
  },

  // Detail View (Images 3, 4, 5)
  detailsCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 18,
  },
  rowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colHalf: {
    width: '48%',
  },
  labelMuted: {
    fontSize: 12,
    color: THEME.labelMuted,
    marginBottom: 4,
  },
  valBold: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  outlineActionBtn: {
    height: 48,
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },

  // Bottom Module Banner (Image 3 & 4)
  bottomBannerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: THEME.canvas,
  },
  bottomModuleBtn: {
    backgroundColor: THEME.moduleBrownBtn,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomModuleBtnText: {
    color: THEME.white,
    fontSize: 13.5,
    fontWeight: '800',
  },
});
