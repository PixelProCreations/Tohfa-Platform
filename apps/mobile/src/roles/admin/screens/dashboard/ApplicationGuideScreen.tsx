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

import { adminColors, adminRadius, adminSpacing } from '../../theme';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',

  // Accent & Action
  orangeBtn: adminColors.brand,
  mediumBadgeBg: '#FEF3C7',
  mediumBadgeText: '#B45309',
};

// ─── Icons ───────────────────────────────────────────────────────────────────

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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ApplicationGuideScreenProps {
  pestName?: string;
  scientificName?: string;
  crop?: string;
  severity?: string;
  onBack: () => void;
  onViewIncidents: () => void;
  onSelectRelatedInput?: () => void;
}

export function ApplicationGuideScreen({
  pestName = 'Aphid',
  scientificName = 'Aphidoidea',
  crop = 'Carrot',
  severity = 'Medium',
  onBack,
  onViewIncidents,
  onSelectRelatedInput,
}: ApplicationGuideScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 1 ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Application Guide</Text>
        </View>

        <Text style={styles.headerSubtitle}>{pestName} — {crop}</Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Pest ─── */}
        <Text style={styles.sectionHeading}>Pest</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Pest Name</Text>
              <Text style={styles.fieldValue}>{pestName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Scientific Name</Text>
              <Text style={styles.fieldValue}>{scientificName}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Crop</Text>
              <Text style={styles.fieldValue}>{crop}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Severity</Text>
              <Text style={styles.fieldValue}>{severity}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Symptoms</Text>
            <Text style={styles.fieldValueNormal}>
              Curling leaves, sticky residue on foliage, stunted growth.
            </Text>
          </View>
        </View>

        {/* ─── 2. Recommended Treatment ─── */}
        <Text style={styles.sectionHeading}>Recommended Treatment</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabelUppercase}>CONFIGURED ORGANIC TREATMENT</Text>
          <Text style={styles.treatmentBody}>
            Neem-oil based foliar spray, applied per configured schedule.
          </Text>
        </View>

        {/* ─── 3. Application Information ─── */}
        <Text style={styles.sectionHeading}>Application Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Application Method</Text>
              <Text style={styles.fieldValue}>Foliar spray</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Timing</Text>
              <Text style={styles.fieldValue}>Early morning</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Frequency</Text>
              <Text style={styles.fieldValue}>Every 7 days</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Crop Stage</Text>
              <Text style={styles.fieldValue}>Vegetative</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.fieldLabel}>Precautions</Text>
            <Text style={styles.fieldValueNormal}>
              Avoid spraying during flowering to protect pollinators.
            </Text>
          </View>
        </View>

        {/* ─── 4. Related Inputs ─── */}
        <Text style={styles.sectionHeading}>Related Inputs</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={onSelectRelatedInput}
          activeOpacity={0.8}
        >
          <Text style={styles.fieldValue}>Neem Oil Concentrate</Text>
          <Text style={styles.subMuted}>Approved bio-input</Text>
        </TouchableOpacity>

        {/* ─── 5. Farmer Incidents ─── */}
        <Text style={styles.sectionHeading}>Farmer Incidents</Text>
        <View style={styles.card}>
          <Text style={styles.fieldValueNormal}>12 incidents related to this pest</Text>
        </View>

        {/* Button: View Incidents */}
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onViewIncidents}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>View Incidents</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // Header
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 34,
    marginTop: 2,
    fontWeight: '500',
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Section Heading
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 14,
    marginBottom: 8,
  },

  // Card Structure
  card: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl, // 16px
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: THEME.labelMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldLabelUppercase: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.labelMuted,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
  },
  fieldValueNormal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.ink,
    lineHeight: 18,
  },
  treatmentBody: {
    fontSize: 13,
    color: THEME.ink,
    lineHeight: 18,
    fontWeight: '600',
  },
  subMuted: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Big Action Outline Button
  outlineBtn: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md, // 12px
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
});
