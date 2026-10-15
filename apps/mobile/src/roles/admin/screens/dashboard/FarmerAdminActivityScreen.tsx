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

function CircleCheckGreenIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.success.text} strokeWidth="2" />
      <Path
        d="M8.5 12.5l2.5 2.5 4.5-4.5"
        stroke={adminColors.success.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CircleCloseRedIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={adminColors.danger.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SwapHorizontalBlueIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M16 3l4 4-4 4"
        stroke={adminColors.info.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 17H4M8 13l-4 4 4 4"
        stroke={adminColors.info.text}
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
          <Text style={styles.headerTitle}>{t('farmerAdminActivity.title')}</Text>
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
              {t('farmerActivity.today')}
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
              {t('farmerActivity.thisWeek')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Activity Cards List */}
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
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  pillBtn: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.lg,
  },
  pillBtnActive: {
    backgroundColor: adminColors.brand,
  },
  pillBtnInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pillText: {
    ...adminType.body,
    fontWeight: '700',
  },
  pillTextActive: {
    color: adminColors.onBrand,
  },
  pillTextInactive: {
    color: adminColors.ink,
  },

  // Activity Cards
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  iconContainer: {
    width: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  textContainer: {
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
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
