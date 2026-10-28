import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

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

// ─── Component ───────────────────────────────────────────────────────────────

export interface FarmerCategoriesGradesScreenProps {
  onBack: () => void;
}

export function FarmerCategoriesGradesScreen({ onBack }: FarmerCategoriesGradesScreenProps) {
  const categories = [
    {
      id: 'cat-veg',
      name: 'Vegetables',
      status: 'Active',
      items: 'Carrot, Cabbage, Radish, Beans',
    },
    {
      id: 'cat-fruit',
      name: 'Fruits',
      status: 'Active',
      items: 'Apple, Orange, Banana',
    },
  ];

  const grades = [
    {
      id: 'g-1',
      title: 'Grade 1',
      description: 'Premium quality',
    },
    {
      id: 'g-2',
      title: 'Grade 2',
      description: 'Standard quality',
    },
    {
      id: 'g-3',
      title: 'Grade 3',
      description: 'Configured lower grade',
    },
    {
      id: 'g-reject',
      title: 'Reject',
      description: 'Not eligible for normal approved produce sale where applicable',
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Categories & Grades</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Category List */}
        <Text style={styles.sectionHeading}>Category List</Text>
        {categories.map((cat) => (
          <View key={cat.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{cat.name}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{cat.status}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>{cat.items}</Text>
          </View>
        ))}

        {/* Grade Reference */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Grade Reference</Text>
        {grades.map((grade) => (
          <View key={grade.id} style={styles.card}>
            <Text style={styles.cardTitle}>{grade.title}</Text>
            <Text style={styles.cardSubtitle}>{grade.description}</Text>
          </View>
        ))}

        <View style={{ height: adminSpacing.xxl }} />
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
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },

  sectionHeading: {
    ...adminType.sectionHeader,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },

  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...adminType.body,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  cardSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 4,
    lineHeight: 17,
  },
});
