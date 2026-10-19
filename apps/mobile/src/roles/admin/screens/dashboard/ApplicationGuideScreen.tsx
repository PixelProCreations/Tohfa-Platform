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

import { t } from '../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── Icons ───────────────────────────────────────────────────────────────────

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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ApplicationGuideScreenProps {
  pestName?: string | undefined;
  scientificName?: string | undefined;
  crop?: string | undefined;
  severity?: string | undefined;
  symptoms?: string | undefined;
  treatment?: string | undefined;
  onBack: () => void;
  onViewIncidents: () => void;
  onSelectRelatedInput?: (() => void) | undefined;
}

export function ApplicationGuideScreen({
  pestName = 'Aphid',
  scientificName = 'Aphidoidea',
  crop = 'Carrot',
  severity = 'Medium',
  symptoms,
  treatment,
  onBack,
  onViewIncidents,
  onSelectRelatedInput,
}: ApplicationGuideScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('applicationGuide.title')}</Text>
        </View>

        {(pestName || crop) ? (
          <Text style={styles.headerSubtitle}>
            {pestName ?? ''}{pestName && crop ? ' — ' : ''}{crop ?? ''}
          </Text>
        ) : null}
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Pest ─── */}
        <Text style={styles.sectionHeading}>{t('applicationGuide.section.pest')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('applicationGuide.pestName')}</Text>
              <Text style={styles.fieldValue}>{pestName || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('applicationGuide.scientificName')}</Text>
              <Text style={styles.fieldValue}>{scientificName || '—'}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, styles.rowSpacing]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('applicationGuide.crop')}</Text>
              <Text style={styles.fieldValue}>{crop || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('applicationGuide.severity')}</Text>
              <Text style={styles.fieldValue}>{severity || '—'}</Text>
            </View>
          </View>

          <View style={styles.rowSpacing}>
            <Text style={styles.fieldLabel}>{t('applicationGuide.symptoms')}</Text>
            <Text style={styles.fieldValueNormal}>
              {t('applicationGuide.sampleSymptoms')}
            </Text>
          </View>
        </View>

        {/* ─── 2. Recommended Treatment ─── */}
        <Text style={styles.sectionHeading}>{t('applicationGuide.section.treatment')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabelUppercase}>{t('applicationGuide.configuredTreatment')}</Text>
          <Text style={styles.treatmentBody}>
            {t('applicationGuide.sampleTreatment')}
          </Text>
        </View>

        {/* ─── 3. Application Information ─── */}
        <Text style={styles.sectionHeading}>{t('applicationGuide.section.applicationInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('applicationGuide.applicationMethod')}</Text>
              <Text style={styles.fieldValue}>{t('applicationGuide.sampleMethod')}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('applicationGuide.timing')}</Text>
              <Text style={styles.fieldValue}>{t('applicationGuide.sampleTiming')}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, styles.rowSpacing]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('applicationGuide.frequency')}</Text>
              <Text style={styles.fieldValue}>{t('applicationGuide.sampleFrequency')}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('applicationGuide.cropStage')}</Text>
              <Text style={styles.fieldValue}>{t('applicationGuide.sampleStage')}</Text>
            </View>
          </View>

          <View style={styles.rowSpacing}>
            <Text style={styles.fieldLabel}>{t('applicationGuide.precautions')}</Text>
            <Text style={styles.fieldValueNormal}>
              {t('applicationGuide.samplePrecautions')}
            </Text>
          </View>
        </View>

        {/* ─── 4. Related Inputs ─── */}
        <Text style={styles.sectionHeading}>{t('applicationGuide.section.relatedInputs')}</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={onSelectRelatedInput}
          activeOpacity={0.8}
        >
          <Text style={styles.fieldValue}>{t('applicationGuide.sampleRelatedInput')}</Text>
          <Text style={styles.subMuted}>{t('applicationGuide.approvedBioInput')}</Text>
        </TouchableOpacity>

        {/* ─── 5. Farmer Incidents ─── */}
        <Text style={styles.sectionHeading}>{t('applicationGuide.section.incidents')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldValueNormal}>{t('applicationGuide.sampleIncidents')}</Text>
        </View>

        {/* Button: View Incidents */}
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onViewIncidents}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>{t('applicationGuide.viewIncidents')}</Text>
        </TouchableOpacity>

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

  // Header
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
    marginLeft: adminSpacing.xs,
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminColors.brandTint,
    marginLeft: adminSpacing.xxl,
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
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },

  // Card Structure
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
  },
  rowSpacing: {
    marginTop: adminSpacing.md,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  fieldLabelUppercase: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginBottom: adminSpacing.xs,
  },
  fieldValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  fieldValueNormal: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '700',
  },
  treatmentBody: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  subMuted: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },

  // Big Action Outline Button
  outlineBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  outlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
