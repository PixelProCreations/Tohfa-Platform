import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import type { deriveFarmRatingView } from '../../../api/farmer';
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import { colors, authPalette as P } from '../../../theme';
import { CARD_ACTION_HIT_SLOP } from './profileHelpers';
import { RatingBarItem } from './RatingBarItem';
import { styles } from './profileStyles';

export function FarmRatingCard({
  ratingView,
  ratingLoading,
  onDetails,
}: {
  ratingView: ReturnType<typeof deriveFarmRatingView>;
  ratingLoading: boolean;
  onDetails: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardIconBox, styles.iconBoxGreen]}>
          <Icon name="star" size={18} color={colors.brandGreen} />
        </View>
        <View style={styles.cardHeaderTitleBox}>
          <Text style={styles.cardTitle}>{t('farmer.profile.rating.title')}</Text>
          <Text style={styles.cardSubtitle}>{t('farmer.profile.rating.subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={onDetails} hitSlop={CARD_ACTION_HIT_SLOP}>
          <Text style={styles.cardActionLink}>{t('farmer.common.details')}</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Circle and Status */}
      <View style={styles.ratingHeroRow}>
        <View style={styles.ratingGaugeContainer}>
          <Svg width="86" height="86" viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r="40"
              stroke={ratingView.isRated ? colors.brandGreenLight : P.slate200}
              strokeWidth="8"
              fill="none"
            />
            <Circle
              cx="50"
              cy="50"
              r="40"
              stroke={ratingView.isRated ? colors.brandGreen : P.slate300}
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={
                2 *
                Math.PI *
                40 *
                (1 - (ratingView.isRated ? (ratingView.overallRating as number) / 100 : 0))
              }
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </Svg>
          <View style={styles.ratingGaugeCenterText}>
            <Text style={styles.ratingGaugeScore}>
              {ratingView.isRated ? ratingView.overallRating : '—'}
            </Text>
            <Text style={styles.ratingGaugeMax}>/100</Text>
          </View>
        </View>

        <View style={styles.ratingStatusDetails}>
          <Text style={styles.ratingStatusTitle}>
            {ratingLoading
              ? '—'
              : ratingView.isRated && ratingView.tierLabelKey
                ? t(ratingView.tierLabelKey as TranslationKey)
                : t('farmer.profile.rating.notRatedTitle')}
          </Text>
        </View>
      </View>

      {/* Rating Category Progress Bars -- first 5 of the 10 canonical
              categories, each with its own "not yet rated" state when the
              server hasn't scored it yet. */}
      <View style={styles.ratingBarsList}>
        {ratingView.modules.slice(0, 5).map((mod) => (
          <RatingBarItem key={mod.categoryCode} mod={mod} />
        ))}
      </View>
    </View>
  );
}
