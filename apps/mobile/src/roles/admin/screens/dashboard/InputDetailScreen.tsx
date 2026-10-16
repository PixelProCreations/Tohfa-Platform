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

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { ApprovedInputItem } from './ApprovedInputsScreen';

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

function BlockCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export interface InputDetailScreenProps {
  inputItem?: ApprovedInputItem | undefined;
  onBack: () => void;
}

export function InputDetailScreen({
  inputItem,
  onBack,
}: InputDetailScreenProps) {
  const item = inputItem;
  const isActive = item?.status === 'Active';

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
            accessibilityLabel={t('inputDetail.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{item?.name ?? ''}</Text>
        </View>

        {/* Status Row */}
        {item?.status ? (
          <View style={styles.headerStatusRow}>
            <Text style={styles.headerStatusLabel}>{t('inputDetail.statusLabel')}</Text>
            <View
              style={[
                styles.statusBadge,
                isActive ? styles.badgeActive : styles.badgeDiscontinued,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isActive ? styles.badgeTextActive : styles.badgeTextDiscontinued,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Basic Information ─── */}
        <Text style={styles.sectionHeading}>{t('inputDetail.section.basicInfo')}</Text>
        <View style={styles.card}>
          {/* Row 1 */}
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.name')}</Text>
              <Text style={styles.fieldValue}>{item?.name ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.code')}</Text>
              <Text style={styles.fieldValue}>{item?.code ?? ''}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.category')}</Text>
              <Text style={styles.fieldValue}>{item?.category ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.subcategory')}</Text>
              <Text style={styles.fieldValue}>{item?.subcategory ?? ''}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.farmingType')}</Text>
              <Text style={styles.fieldValue}>{item?.farmingType ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.status')}</Text>
              <Text style={styles.fieldValue}>{item?.status ?? ''}</Text>
            </View>
          </View>

          {/* Row 4 */}
          <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.approvedDate')}</Text>
              <Text style={styles.fieldValue}>{item?.approvedDate ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.manufacturer')}</Text>
              <Text style={styles.fieldValue}>{item?.manufacturer ?? ''}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Usage Information ─── */}
        <Text style={styles.sectionHeading}>{t('inputDetail.section.usageInfo')}</Text>
        <View style={styles.card}>
          {/* Row 1 */}
          <View style={styles.colFull}>
            <Text style={styles.fieldLabel}>{t('inputDetail.label.method')}</Text>
            <Text style={styles.fieldValue}>{item?.method ?? ''}</Text>
          </View>

          {/* Row 2 */}
          <View style={[styles.twoColRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.usage')}</Text>
              <Text style={styles.fieldValue}>{item?.usage ?? ''}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('inputDetail.label.frequency')}</Text>
              <Text style={styles.fieldValue}>{item?.frequency ?? ''}</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Related Crops ─── */}
        {item?.crops && item.crops.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>{t('inputDetail.section.relatedCrops')}</Text>
            <View style={styles.card}>
              <View style={styles.cropsRow}>
                {item.crops.map((crop) => (
                  <View key={crop} style={styles.cropPill}>
                    <Text style={styles.cropPillText}>{crop}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

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
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 34,
    marginTop: adminSpacing.xs,
  },
  headerStatusLabel: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
  },
  badgeTextActive: {
    color: adminColors.success.text,
  },
  badgeDiscontinued: {
    backgroundColor: adminColors.muted,
  },
  badgeTextDiscontinued: {
    color: adminColors.onBrand,
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
  colFull: {
    width: '100%',
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
    fontWeight: '500',
  },
  fieldValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },

  // Related Crops Row
  cropsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  cropPill: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  cropPillText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
