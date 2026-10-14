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
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  ink: adminColors.ink,
  muted: adminColors.muted,

  // Tabs
  tabActiveBg: adminColors.brand,
  tabInactiveBg: 'transparent',
  tabInactiveBorder: adminColors.border,

  // Status Colors
  greenText: '#15803D',
  redText: '#DC2626',
  blueText: '#2563EB',
};

// ─── SVG Icons Matching Exact UI ─────────────────────────────────────────────

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

// Green Checkmark in Circle
function CircleCheckGreenIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#15803D" strokeWidth="2" />
      <Path
        d="M8.5 12.5l2.5 2.5 4.5-4.5"
        stroke="#15803D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Red Cross / X in Circle
function CircleCloseRedIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="2" />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Blue Swap Horizontal Arrows — Top points right, bottom points left
function SwapHorizontalBlueIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top arrow pointing RIGHT */}
      <Path
        d="M4 7h16M16 3l4 4-4 4"
        stroke="#2563EB"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom arrow pointing LEFT */}
      <Path
        d="M20 17H4M8 13l-4 4 4 4"
        stroke="#2563EB"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface FarmerAdminActivityScreenProps {
  onBack: () => void;
  onNavigateToListings?: () => void;
}

export function FarmerAdminActivityScreen({ onBack, onNavigateToListings }: FarmerAdminActivityScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'week'>('today');

  const todayActivities = [
    {
      id: 'act-1',
      type: 'approved',
      title: 'Listing Approved',
      subtitle: 'Tomato — Grade 1 · Farmer: Ramesh · Today, 10:24 AM',
    },
    {
      id: 'act-2',
      type: 'rejected',
      title: 'Listing Rejected',
      subtitle: 'Carrot — Grade 2 · Farmer: Kumar · Today, 09:50 AM',
    },
    {
      id: 'act-3',
      type: 'counter',
      title: 'Counter-offer sent',
      subtitle: 'Beans — 75 KG · Today, 09:09 AM',
    },
  ];

  const weekActivities = [
    ...todayActivities,
    {
      id: 'act-4',
      type: 'approved',
      title: 'Listing Approved',
      subtitle: 'Potato — Grade 1 · Farmer: Selvi · Yesterday, 04:15 PM',
    },
    {
      id: 'act-5',
      type: 'counter',
      title: 'Counter-offer sent',
      subtitle: 'Cabbage — 40 KG · Farmer: Anand · 8 Oct 2026, 11:30 AM',
    },
  ];

  const list = selectedFilter === 'today' ? todayActivities : weekActivities;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Terracotta Header Matching Screenshot 3 ─── */}
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
          <Text style={styles.headerTitle}>Farmer Admin Activity</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Pills Row */}
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pillBtn,
              selectedFilter === 'today' ? styles.pillBtnActive : styles.pillBtnInactive,
            ]}
            onPress={() => setSelectedFilter('today')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillText,
                selectedFilter === 'today' ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillBtn,
              selectedFilter === 'week' ? styles.pillBtnActive : styles.pillBtnInactive,
            ]}
            onPress={() => setSelectedFilter('week')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillText,
                selectedFilter === 'week' ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activity Cards List matching Screenshot 3 */}
        {list.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={styles.activityCard}
            onPress={onNavigateToListings}
            activeOpacity={onNavigateToListings ? 0.75 : 1}
          >
            <View style={styles.iconContainer}>
              {act.type === 'approved' && <CircleCheckGreenIcon size={22} />}
              {act.type === 'rejected' && <CircleCloseRedIcon size={22} />}
              {act.type === 'counter' && <SwapHorizontalBlueIcon size={22} />}
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.activityTitle}>{act.title}</Text>
              <Text style={styles.activitySubtitle}>{act.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet Matching Screenshot 3 Exact UI ───────────────────────────────

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
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  pillBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 14,
  },
  pillBtnActive: {
    backgroundColor: THEME.tabActiveBg,
  },
  pillBtnInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.tabInactiveBorder,
  },
  pillText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  pillTextActive: {
    color: THEME.white,
  },
  pillTextInactive: {
    color: THEME.ink,
  },

  // Activity Cards
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  iconContainer: {
    width: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    paddingLeft: 4,
  },
  activityTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.ink,
    lineHeight: 18,
  },
  activitySubtitle: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 3,
  },
});
