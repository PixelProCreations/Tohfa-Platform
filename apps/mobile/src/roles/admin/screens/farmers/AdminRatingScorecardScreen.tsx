import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon, ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useFarmerRating } from '../../api/farmerHooks';
import { t } from '../../i18n';
import { RATING_CATEGORY_CODES } from './AdminEditRatingCategoriesScreen';
import type { FarmerListItem } from './AdminAllFarmersScreen';

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
  onOpenComplianceTiers: () => void;
  onEditCategories?: () => void;
}

export const AdminRatingScorecardScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onOpenComplianceTiers,
  onEditCategories,
}) => {
  const ratingQuery = useFarmerRating(undefined, farmer.id);
  const liveRating = ratingQuery.rating;

  const rawScore = liveRating?.overallRating ?? farmer.rating;
  const scoreDisplay = rawScore !== undefined && rawScore !== null ? String(rawScore) : ADMIN_NO_VALUE;
  const scorePercent = typeof rawScore === 'number' && rawScore > 0 ? Math.min(100, rawScore) / 100 : 0;

  // The server's tier code, named through i18n; the list's label when the rating has not loaded.
  const tierCode = liveRating?.ratingTierCode ?? null;
  const tierDisplay = tierCode !== null ? t(`farmersList.filter.tier.${tierCode}`) : farmer.ratingTier ?? ADMIN_NO_VALUE;

  // BR-06: the ten seeded categories by their real codes; the live score where the rating has one, else the dash.
  const categories = React.useMemo(
    () =>
      RATING_CATEGORY_CODES.map((code) => {
        const live = liveRating?.categories.find((c) => c.code === code);
        return {
          code,
          name: t(`farmerDetail.rating.category.${code}`),
          score: live?.score ?? null,
          max: live?.maxScore ?? null,
          color: adminColors.brand,
        };
      }),
    [liveRating?.categories],
  );

  const circumference = 2 * Math.PI * 60;

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />

      {/* Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke={adminColors.ink}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Ring Gauge (Clickable) */}
        <TouchableOpacity
          style={styles.gaugeContainer}
          activeOpacity={0.8}
          onPress={onOpenComplianceTiers}
          accessibilityRole="button"
          accessibilityLabel="View compliance tiers"
        >
          <View style={styles.ringWrapper}>
            <Svg width={150} height={150} viewBox="0 0 150 150">
              {/* Background Track Circle */}
              <Circle
                cx={75}
                cy={75}
                r={60}
                stroke={adminColors.border}
                strokeWidth={14}
                fill="none"
              />
              {/* Active Arc */}
              {scorePercent > 0 && (
                <Circle
                  cx={75}
                  cy={75}
                  r={60}
                  stroke={adminColors.brand}
                  strokeWidth={14}
                  strokeDasharray={`${circumference * scorePercent} ${circumference * (1 - scorePercent)}`}
                  strokeDashoffset={circumference * 0.25}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </Svg>

            <View style={styles.scoreTextWrapper}>
              <Text style={styles.scoreNumber}>{scoreDisplay}</Text>
              <Text style={styles.scoreDenominator}>/ 100</Text>
            </View>
          </View>

          {/* Tier Capsule */}
          <View style={styles.tierCapsule}>
            <Text style={styles.tierCapsuleText}>{tierDisplay}</Text>
          </View>
        </TouchableOpacity>

        {/* Farmer Code & Categories Subtitle */}
        <Text style={styles.metaSubtitle}>
          {farmer.name} · {farmer.code ?? ADMIN_NO_VALUE} · 10 categories × 10 pts
        </Text>

        {/* Category Progress Bars */}
        <View style={styles.categoriesList}>
          {categories.map((cat) => (
            <View key={cat.code} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width:
                        cat.score !== null && cat.max !== null && cat.max > 0
                          ? `${Math.min(100, (cat.score / cat.max) * 100)}%`
                          : '0%',
                      backgroundColor: cat.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.categoryScore}>
                {cat.score !== null && cat.max !== null
                  ? t('farmerDetail.rating.categoryScore', { score: cat.score, max: cat.max })
                  : ADMIN_NO_VALUE}
              </Text>
            </View>
          ))}
        </View>

        {/* Improvement suggestions */}
        <Text style={styles.suggestionsHeading}>Improvement suggestions</Text>

        <View style={styles.tipCard}>
          <View style={styles.tipIconColumn}>
            <Icon name="lightbulb" size={20} color={adminColors.warning.text} />
          </View>
          <View style={styles.tipContent}>
            {/* The design's improvement tip has no source in the API. */}
            <Text style={styles.tipTitle}>{ADMIN_NO_VALUE}</Text>
            <Text style={styles.tipDescription}>{ADMIN_NO_VALUE}</Text>
          </View>
        </View>

        {/* Edit All Categories Button (if permitted) */}
        {onEditCategories && (
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.85}
            onPress={onEditCategories}
          >
            <Icon name="edit" size={18} color={adminColors.onBrand} style={{ marginRight: 8 }} />
            <Text style={styles.editBtnText}>Edit All Categories</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  ringWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scoreTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    ...adminType.title,
    fontSize: 32,
    fontWeight: '900',
    color: adminColors.ink,
    letterSpacing: -0.5,
  },
  scoreDenominator: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 2,
  },
  tierCapsule: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },
  tierCapsuleText: {
    color: adminColors.onBrand,
    ...adminType.caption,
    fontWeight: '800',
  },
  metaSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  categoriesList: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    width: 105,
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
    lineHeight: 16,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.full,
    marginHorizontal: adminSpacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: adminRadius.full,
  },
  categoryScore: {
    width: 50,
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    textAlign: 'right',
  },
  suggestionsHeading: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderLeftWidth: 4,
    borderLeftColor: adminColors.warning.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  tipIconColumn: {
    marginRight: adminSpacing.sm,
    marginTop: 1,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 4,
  },
  tipDescription: {
    ...adminType.caption,
    lineHeight: 17,
    color: adminColors.muted,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 52,
    ...adminShadow.sm,
  },
  editBtnText: {
    color: adminColors.onBrand,
    ...adminType.body,
    fontWeight: '800',
  },
});
