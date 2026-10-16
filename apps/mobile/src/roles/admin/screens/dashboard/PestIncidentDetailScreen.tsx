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
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { IncidentItem } from './FarmerPestIncidentsScreen';

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

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BlockCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PestIncidentDetailScreenProps {
  incident?: IncidentItem | undefined;
  onBack: () => void;
  onViewPest?: () => void;
  onViewApplicationGuide?: () => void;
}

export function PestIncidentDetailScreen({
  incident,
  onBack,
  onViewPest,
  onViewApplicationGuide,
}: PestIncidentDetailScreenProps) {
  const item = incident;

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
            accessibilityLabel={t('pestIncidentDetail.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('pestIncidentDetail.title')}</Text>

          <View style={styles.filterBtn}>
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </View>
        </View>

        <Text style={styles.headerSubtitle}>
          {t('pestIncidentDetail.subtitle')}
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Farmer ─── */}
        <Text style={styles.sectionHeading}>{t('pestIncidentDetail.section.farmer')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.name')}</Text>
              <Text style={styles.fieldValue}>{item?.farmer ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.farmerId')}</Text>
              <Text style={styles.fieldValue}>{item?.farmerId ?? ''}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.farm')}</Text>
              <Text style={styles.fieldValue}>{item?.farm ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.zone')}</Text>
              <Text style={styles.fieldValue}>{item?.zone ?? ''}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Crop ─── */}
        <Text style={styles.sectionHeading}>{t('pestIncidentDetail.section.crop')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.cropName')}</Text>
              <Text style={styles.fieldValue}>{item?.crop ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.variety')}</Text>
              <Text style={styles.fieldValue}>{item?.variety ?? ''}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.farmZone')}</Text>
              <Text style={styles.fieldValue}>{item?.farmZone ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.cropStage')}</Text>
              <Text style={styles.fieldValue}>{item?.cropStage ?? ''}</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Pest ─── */}
        <Text style={styles.sectionHeading}>{t('pestIncidentDetail.section.pest')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.commonName')}</Text>
              <Text style={styles.fieldValue}>{item?.pest ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.scientificName')}</Text>
              <Text style={styles.fieldValue}>{item?.scientificName ?? ''}</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.severity')}</Text>
            <Text style={styles.fieldValue}>{item?.severity ?? ''}</Text>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.symptoms')}</Text>
            <Text style={styles.fieldValueNormal}>{item?.farmerNotes || 'Curling leaves, sticky residue on foliage.'}</Text>
          </View>
        </View>

        {/* Button: View Pest */}
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onViewPest}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>{t('pestIncidentDetail.action.viewPest')}</Text>
        </TouchableOpacity>

        {/* ─── 4. Detection ─── */}
        <Text style={styles.sectionHeading}>{t('pestIncidentDetail.section.detection')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.date')}</Text>
              <Text style={styles.fieldValue}>{item?.detectedDate ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.locationZone')}</Text>
              <Text style={styles.fieldValue}>{item?.farmZone ?? ''}</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.farmerNotes')}</Text>
            <Text style={styles.fieldValueNormal}>{item?.farmerNotes ?? ''}</Text>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.photos')}</Text>
            <Text style={styles.fieldValue}>{item?.photos ?? ''}</Text>
          </View>
        </View>

        {/* ─── 5. Treatment ─── */}
        <Text style={styles.sectionHeading}>{t('pestIncidentDetail.section.treatment')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabelUppercase}>{t('pestIncidentDetail.label.treatment')}</Text>
          <Text style={styles.fieldValueNormal}>{item?.treatmentName ?? ''}</Text>
        </View>

        <View style={[styles.card, { marginTop: adminSpacing.sm }]}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.applicationDate')}</Text>
              <Text style={styles.fieldValue}>{item?.treatmentDate ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.treatmentStatus')}</Text>
              <Text style={styles.fieldValue}>{item?.treatmentStatus ?? ''}</Text>
            </View>
          </View>

          <View style={{ marginTop: adminSpacing.md }}>
            <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.notes')}</Text>
            <Text style={styles.fieldValueNormal}>{item?.treatmentNotes ?? ''}</Text>
          </View>
        </View>

        {/* Button: View Application Guide */}
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={onViewApplicationGuide}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>{t('pestIncidentDetail.action.viewApplicationGuide')}</Text>
        </TouchableOpacity>

        {/* ─── 6. Resolution ─── */}
        <Text style={styles.sectionHeading}>{t('pestIncidentDetail.section.resolution')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('pestIncidentDetail.label.status')}</Text>
          <Text style={[styles.fieldValue, { color: adminColors.info.text }]}>
            {item?.status ?? ''}
          </Text>
        </View>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: adminSpacing.xs,
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
  col: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
    fontWeight: '500',
  },
  fieldLabelUppercase: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  fieldValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  fieldValueNormal: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    lineHeight: 18,
  },

  // Outline Buttons
  outlineBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  outlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },

  // Read-only Banner
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.md,
    gap: 10,
  },
  readOnlyText: {
    flex: 1,
    ...adminType.rowMeta,
    color: adminColors.muted,
    lineHeight: 16,
  },
});
