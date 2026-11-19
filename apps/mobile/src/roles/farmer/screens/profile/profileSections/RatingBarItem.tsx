import React from 'react';
import { Text, View } from 'react-native';
import type { deriveFarmRatingView } from '../../../api/farmer';
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import { ratingBarColor } from './profileHelpers';
import { styles } from './profileStyles';

type RatingModule = ReturnType<typeof deriveFarmRatingView>['modules'][number];

/** One farm-rating category: name, score (or "not rated") and its progress bar. */
export function RatingBarItem({ mod }: { mod: RatingModule }): React.JSX.Element {
  const barColor = ratingBarColor(mod.score);
  return (
    <View style={styles.barItem}>
      <View style={styles.barHeader}>
        <Text style={styles.barTitle}>{t(mod.nameKey as TranslationKey)}</Text>
        <Text style={[styles.barScore, { color: barColor }]}>
          {mod.isRated
            ? t('farmer.profile.rating.score', { score: mod.score ?? 0 })
            : t('farmer.profile.rating.notRatedShort')}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${(mod.score ?? 0) * 10}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}
