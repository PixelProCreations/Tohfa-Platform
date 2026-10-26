import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { FarmerRatingsScreen } from './FarmerRatingsScreen';

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

// 1. Tomato / Produce outline icon
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

// 2. Rosette badge check icon
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

// 3. Document icon with folded corner
function DocumentViewIcon({ size = 22, color = adminColors.muted }: { size?: number; color?: string }) {
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

// 5. Circle checkmark icon
function CircleCheckIcon({ size = 22, color = adminColors.success.text }: { size?: number; color?: string }) {
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
  farmerName = '',
  farmerId = '',
  onBack,
}: FarmerHistoryScreenProps) {
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
  const [showRatingsScreen, setShowRatingsScreen] = useState<boolean>(false);

  const historyItems: HistoryItem[] = [
    {
      id: 'hist-1',
      event: 'Produce listing submitted',
      date: '28 Sep',
      fullDate: '28 Sep 2026',
      reference: 'PL-001245',
      status: 'Recorded',
      category: 'Produce',
    },
    {
      id: 'hist-2',
      event: 'Farm audit completed',
      date: '25 Sep',
      fullDate: '28 Sep 2026',
      reference: 'AUD-00125',
      status: 'Recorded',
      category: 'Audit',
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
    },
  ];

  const filteredItems = historyItems;

  // ─── IF NAVIGATING TO FARMER RATINGS ───
  if (showRatingsScreen) {
    return (
      <FarmerRatingsScreen
        farmerName={farmerName}
        farmerId={farmerId}
        onBack={() => setShowRatingsScreen(false)}
      />
    );
  }

  // ─── IF A HISTORY ITEM IS SELECTED: SHOW HISTORY DETAIL ───
  if (selectedHistory) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Terracotta Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSelectedHistory(null)}
              activeOpacity={0.7}
              accessibilityLabel="Back to History"
            >
              <BackArrowIcon size={24} color={adminColors.onBrand} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{t('farmerHistory.detail.title')}</Text>
              <Text style={styles.headerSubDetail}>{farmerName} · {farmerId}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPadDetail}
          showsVerticalScrollIndicator={false}
        >
          {/* Detail Card */}
          <View style={styles.detailsCard}>
            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>{t('farmerHistory.detail.event')}</Text>
                <Text style={styles.valBold}>{selectedHistory.event}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>{t('farmerHistory.detail.date')}</Text>
                <Text style={styles.valBold}>{selectedHistory.fullDate}</Text>
              </View>
            </View>

            <View style={[styles.rowTwoCol, styles.rowSpacing]}>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>{t('farmerHistory.detail.reference')}</Text>
                <Text style={styles.valBold}>{selectedHistory.reference}</Text>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.labelMuted}>{t('farmerHistory.detail.status')}</Text>
                <Text style={styles.valBold}>{selectedHistory.status}</Text>
              </View>
            </View>
          </View>

          {/* Action: Back to History */}
          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => setSelectedHistory(null)}
            activeOpacity={0.8}
            accessibilityLabel="Back to History"
          >
            <Text style={styles.outlineActionBtnText}>Back to History</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN FARMER HISTORY TIMELINE VIEW ───
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header */}
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
          <Text style={styles.headerTitle}>{t('farmerHistory.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >


        {/* Year Section Header */}
        <Text style={styles.yearHeader}>{t('farmerHistory.year.2026')}</Text>

        {/* History Cards */}
        {filteredItems.map((item) => {
          let icon = <TomatoProduceIcon size={22} color={adminColors.warning.text} />;
          if (item.event === 'Farm audit completed') {
            icon = <BadgeCheckIcon size={22} color={adminColors.success.text} />;
          } else if (item.event === 'Certification document viewed') {
            icon = <DocumentViewIcon size={22} color={adminColors.muted} />;
          } else if (item.event === 'Farmer rating updated') {
            icon = <StarOutlineIcon size={22} color={adminColors.warning.text} />;
          } else if (item.event === 'Produce listing approved') {
            icon = <CircleCheckIcon size={22} color={adminColors.success.text} />;
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

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    ...adminType.caption,
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
  scrollPadDetail: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    flexGrow: 1,
  },

  // Category chips
  chipsSection: {
    marginBottom: adminSpacing.lg,
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

  // Year Section Header
  yearHeader: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginBottom: adminSpacing.sm,
  },

  // History Card
  historyCard: {
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
  historyIconCol: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  historyTextCol: {
    flex: 1,
    paddingLeft: adminSpacing.xs,
  },
  historyTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  historySubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },

  // Detail View
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xl,
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
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
