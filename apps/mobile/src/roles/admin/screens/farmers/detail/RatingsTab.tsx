/**
 * Ratings tab (team design M2-S06), read-only from GET .../rating (BR-06).
 *
 * The hero shows the API's 0-100 figure as the API gives it (the design's
 * star figure is not derived). Category labels are the client catalogue for
 * the server's category codes. Farm name and last audit have no API (dash);
 * rating history has no endpoint (empty state). The sticky "Edit Rating" bar
 * is drawn by the shell only with `farmer.rating.edit`.
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { LiveFarmerRating } from '../../../api/farmerHooks';
import type { FarmerDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { ratingCategoryRows, ratingFarmInfo, ratingHero, type FarmerDetailAccess } from './model';
import { EmptyCard, SectionTitle, TabQueryGate } from './parts';
import { detailStyles as s } from './styles';

export function RatingsTab({
  farmer,
  access,
  live,
}: {
  farmer: FarmerDetailView;
  access: FarmerDetailAccess;
  live: LiveFarmerRating;
}) {
  return (
    <TabQueryGate
      permitted={access.canViewRating}
      hasData={live.rating !== undefined}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
    >
      {live.rating !== undefined ? <RatingBody farmer={farmer} live={live} /> : null}
    </TabQueryGate>
  );
}

function RatingBody({ farmer, live }: { farmer: FarmerDetailView; live: LiveFarmerRating }) {
  if (live.rating === undefined) return null;
  const hero = ratingHero(live.rating);
  const categories = ratingCategoryRows(live.rating);
  const info = ratingFarmInfo(farmer);
  return (
    <>
      <View style={s.heroRatingCard}>
        <Text style={s.heroScore}>{hero.score}</Text>
        <Text style={s.heroLabel}>{t('farmerDetail.rating.overall')}</Text>
        <Text style={s.heroDate}>{hero.date}</Text>
      </View>

      <SectionTitle>{t('farmerDetail.rating.categoryScores')}</SectionTitle>
      {categories.length === 0 ? (
        <EmptyCard text={t('farmerDetail.rating.categoriesEmpty')} />
      ) : (
        <View style={s.detailsCard}>
          {categories.map((c, i) => (
            <View key={c.code} style={[s.categoryRow, i === categories.length - 1 && s.tableRowLast]}>
              <Text style={s.categoryLabel}>{c.label}</Text>
              <Text style={s.categoryScore}>{c.score}</Text>
            </View>
          ))}
        </View>
      )}

      <SectionTitle spaced>{t('farmerDetail.rating.farmInfo')}</SectionTitle>
      <View style={s.detailsCard}>
        <View style={s.twoColumnGrid}>
          {info.map((cell) => (
            <View key={cell.label} style={s.gridCell}>
              <Text style={s.metaLabel}>{cell.label}</Text>
              <Text style={s.metaValue}>{cell.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionTitle spaced>{t('farmerDetail.rating.history')}</SectionTitle>
      <EmptyCard text={t('farmerDetail.rating.historyEmpty')} />
    </>
  );
}
