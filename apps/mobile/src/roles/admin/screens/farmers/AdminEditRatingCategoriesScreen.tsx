/**
 * Edit All Categories: a farmer's farm rating, category by category.
 *
 * BR-06: the rating is 10 seeded categories x 0-10 points = 0-100 (BR-04b),
 * and it is written only by completing an INTERNAL audit. The manual edit was
 * reinstated as a permission (farmer.rating.edit, 2026-11-09) but NO endpoint
 * exists, so both Save controls are drawn and disabled with a note, and the
 * steppers cannot change anything. Scores shown are the farmer's current
 * rating from GET /admin/farmers/{id}/rating; a category with no score is the
 * dash. The tier is the server's tier code; no threshold lives here.
 */
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { BackArrowWhiteIcon } from '../../components/AdminIcons';
import { useFarmerRating } from '../../api/farmerHooks';
import type { RatingTierCode } from '../../api/farmers';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { t } from '../../i18n';
import type { FarmerListItem } from './AdminAllFarmersScreen';

/** The ten seeded rating_categories codes, in sort order (db/seed/001_reference.sql, BR-06). */
export const RATING_CATEGORY_CODES = [
  'CERTIFICATION',
  'SOIL_LAND',
  'FARMING_PRACTICES',
  'ENVIRONMENTAL',
  'PRODUCE_QUALITY',
  'TRACEABILITY',
  'SOCIAL_LABOR',
  'FINANCIAL',
  'MARKET_RELATIONS',
  'INNOVATION',
] as const;

export type RatingCategoryCode = (typeof RATING_CATEGORY_CODES)[number];

export interface RatingCategoryState {
  code: RatingCategoryCode;
  score: number | null;
  max: number | null;
}

/** Tier colours keyed by the server's tier CODE; the score bands stay on the server (BR-04a). */
const TIER_TONE: Record<RatingTierCode, { bg: string; text: string }> = {
  EXCELLENT: { bg: adminColors.success.bg, text: adminColors.success.text },
  GOOD: { bg: adminColors.warning.bg, text: adminColors.warning.text },
  MODERATE: { bg: adminColors.card, text: adminColors.muted },
  POOR: { bg: adminColors.danger.bg, text: adminColors.danger.text },
};

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
}

export const AdminEditRatingCategoriesScreen: React.FC<Props> = ({ farmer, onBack }) => {
  const ratingQuery = useFarmerRating(undefined, farmer.id);
  const rating = ratingQuery.rating;

  const categories: RatingCategoryState[] = RATING_CATEGORY_CODES.map((code) => {
    const live = rating?.categories.find((c) => c.code === code);
    return { code, score: live?.score ?? null, max: live?.maxScore ?? null };
  });

  const total = rating?.overallRating ?? null;
  const tierCode = rating?.ratingTierCode ?? null;
  const tone = tierCode === null ? { bg: adminColors.card, text: adminColors.muted } : TIER_TONE[tierCode];
  const totalFraction = total === null ? 0 : Math.max(0, Math.min(100, total)) / 100;

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: adminSpacing.sm }}>
          <Text style={styles.headerTitle}>{t('wiringFarmers.rating.edit.title')}</Text>
          <Text style={styles.headerSub}>
            {t('wiringFarmers.rating.edit.subtitle', { name: farmer.name, code: farmer.code ?? ADMIN_NO_VALUE })}
          </Text>
        </View>

        {/* BR-06: no rating write endpoint exists. */}
        <TouchableOpacity
          style={[styles.saveHeaderBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
        >
          <Text style={styles.saveHeaderBtnText}>{t('wiringFarmers.rating.edit.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Score Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>{t('wiringFarmers.rating.edit.totalLabel')}</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.totalScoreNumber}>{total === null ? ADMIN_NO_VALUE : String(total)}</Text>
              <Text style={styles.totalScoreDenominator}>/ 100</Text>
            </View>
            <View style={[styles.tierCapsule, { backgroundColor: tone.bg }]}>
              <Text style={[styles.tierCapsuleText, { color: tone.text }]}>
                {tierCode === null ? ADMIN_NO_VALUE : t(`farmersList.filter.tier.${tierCode}`)}
              </Text>
            </View>
          </View>

          {/* Mini circular progress meter */}
          <View style={styles.gaugeBox}>
            <Svg width={80} height={80} viewBox="0 0 80 80">
              <Circle cx={40} cy={40} r={32} stroke={adminColors.border} strokeWidth={8} fill="none" />
              {total !== null && (
                <Circle
                  cx={40}
                  cy={40}
                  r={32}
                  stroke={adminColors.brand}
                  strokeWidth={8}
                  strokeDasharray={`${2 * Math.PI * 32 * totalFraction} ${2 * Math.PI * 32}`}
                  strokeDashoffset={2 * Math.PI * 32 * 0.25}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </Svg>
            <Text style={styles.gaugePctText}>{total === null ? ADMIN_NO_VALUE : `${total}%`}</Text>
          </View>
        </View>

        {/* 10 Categories List */}
        <Text style={styles.sectionHeading}>{t('wiringFarmers.rating.edit.sectionHeading')}</Text>

        {categories.map((cat, idx) => (
          <View key={cat.code} style={styles.categoryCard}>
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>
                  {t('wiringFarmers.rating.edit.categoryName', {
                    index: idx + 1,
                    name: t(`farmerDetail.rating.category.${cat.code}`),
                  })}
                </Text>
                {/* The design's per-category description has no source. */}
                <Text style={styles.catSub}>{ADMIN_NO_VALUE}</Text>
              </View>

              {/* Score Stepper: drawn, disabled (nothing can be saved). */}
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepBtn, styles.actionUnavailable]}
                  disabled
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.scoreInput}
                  value={cat.score === null ? ADMIN_NO_VALUE : String(cat.score)}
                  editable={false}
                  keyboardType="numeric"
                  maxLength={3}
                />

                <TouchableOpacity
                  style={[styles.stepBtn, styles.actionUnavailable]}
                  disabled
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Linear Progress Bar: the score against the category's own max; empty when unknown. */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width:
                      cat.score !== null && cat.max !== null && cat.max > 0
                        ? `${Math.min(100, (cat.score / cat.max) * 100)}%`
                        : '0%',
                    backgroundColor: adminColors.brand,
                  },
                ]}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBottomBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
        >
          <Text style={styles.saveBottomBtnText}>{t('wiringFarmers.rating.edit.saveAll')}</Text>
        </TouchableOpacity>
        <Text style={styles.unavailableNote}>{t('wiringFarmers.rating.edit.saveUnavailable')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  backButton: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  headerSub: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.85,
    marginTop: 2,
  },
  saveHeaderBtn: {
    backgroundColor: adminColors.onBrand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.sm,
  },
  saveHeaderBtnText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl * 2,
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  totalScoreNumber: {
    ...adminType.title,
    fontSize: 32,
    fontWeight: '800',
    color: adminColors.ink,
  },
  totalScoreDenominator: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.muted,
    marginLeft: 4,
  },
  tierCapsule: {
    alignSelf: 'flex-start',
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
  },
  tierCapsuleText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  gaugeBox: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePctText: {
    position: 'absolute',
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  categoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  catName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  catSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 3,
    marginLeft: adminSpacing.sm,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.ink,
    lineHeight: 20,
  },
  scoreInput: {
    width: 44,
    textAlign: 'center',
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    paddingVertical: 2,
  },
  barTrack: {
    height: 6,
    backgroundColor: adminColors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  saveBottomBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
    ...adminShadow.sm,
  },
  saveBottomBtnText: {
    color: adminColors.onBrand,
    ...adminType.body,
    fontWeight: '800',
  },
  actionUnavailable: {
    opacity: 0.5,
  },
  unavailableNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
    textAlign: 'center',
  },
});
