import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FarmBoundaryMap, Icon, Skeleton, type FarmBoundaryMapLoadError } from '@tohfa/mobile-ui';
import type { Farm } from '../../../api/farms';
import { t } from '../../../../../i18n/farmer';
import { colors, authPalette as P } from '../../../theme';
import type { buildFarmMapPreview } from '../farmMapPreview';
import { CARD_ACTION_HIT_SLOP, farmTagLabel, type FarmDetailsData } from './profileHelpers';
import { styles } from './profileStyles';

/** The Farm & FMB preview map is `readOnly`, so it never emits a change; the prop is required. */
const noopPolygonChange = (): void => {};

interface FarmFmbCardProps {
  farmsLoading: boolean;
  farmDetails: FarmDetailsData;
  mapPreview: ReturnType<typeof buildFarmMapPreview>;
  previewFarm: Farm | null;
  hasBoundary: boolean;
  showPreviewMap: boolean;
  gpsStatusLabel: string;
  onMapLoadError: (error?: FarmBoundaryMapLoadError) => void;
  onEdit: () => void;
}

export function FarmFmbCard({
  farmsLoading,
  farmDetails,
  mapPreview,
  previewFarm,
  hasBoundary,
  showPreviewMap,
  gpsStatusLabel,
  onMapLoadError,
  onEdit,
}: FarmFmbCardProps): React.JSX.Element {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardIconBox, styles.iconBoxGreen]}>
          <Icon name="shield" size={18} color={colors.brandGreen} />
        </View>
        <View style={styles.cardHeaderTitleBox}>
          <Text style={styles.cardTitle}>{t('farmer.profile.farm.title')}</Text>
          <Text style={styles.cardSubtitle}>{t('farmer.profile.farm.subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} hitSlop={CARD_ACTION_HIT_SLOP}>
          <Text style={styles.cardActionLink}>{t('farmer.common.edit')}</Text>
        </TouchableOpacity>
      </View>

      {/* FMB Map Preview — the same Mapbox FarmBoundaryMap as FMB Sketch, read-only. The whole
              preview is one tap target into FMB Sketch. The map's own gestures are off and its
              wrapper is `pointerEvents="none"`, so a swipe that starts on it scrolls this page
              and a tap lands on the TouchableOpacity rather than inside the native map. */}
      <TouchableOpacity
        style={styles.fmbMapContainer}
        onPress={onEdit}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('farmer.profile.farm.a11y.openMap')}
        testID="profile-fmb-map-preview"
      >
        {farmsLoading ? (
          <Skeleton borderRadius={0} style={styles.fmbMapSkeleton} />
        ) : showPreviewMap ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <FarmBoundaryMap
              // FarmBoundaryMap reads initialCenter/initialPolygon only at mount, so remount
              // whenever the farm or its saved boundary changes (e.g. after an FMB Sketch save).
              key={`${previewFarm?.id ?? 'none'}:${previewFarm?.boundaryVersion ?? 0}:${previewFarm?.updatedAt ?? ''}`}
              initialCenter={mapPreview.center}
              initialPolygon={mapPreview.polygon}
              // A farm with only a stored centroid has no shape to draw; pin the point instead.
              // The default region is not the farmer's land, so nothing is pinned on it.
              markerCoordinate={!hasBoundary && mapPreview.hasLocation ? mapPreview.center : null}
              onPolygonChange={noopPolygonChange}
              onMapLoadError={onMapLoadError}
              readOnly
              gesturesEnabled={false}
              // Two levels below FarmBoundaryMap's own default (17, tuned for a full-screen
              // editor) -- this card is only ~135px tall, and at 17 a farm of a few acres runs
              // off the top/bottom edge instead of showing the whole shape with some margin.
              initialZoom={15}
              searchPlaceholder={t('farmer.map.searchPlaceholder')}
              testID="profile-fmb-map"
            />
            {/* No boundary yet: the map stays visible and the call to action sits over it. */}
            {hasBoundary ? null : (
              <View style={[styles.gpsCoordinatesBadge, styles.fmbMapHintBadge]}>
                <Text style={styles.gpsCoordinatesText}>{t('farmer.profile.farm.mapEmpty')}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.fmbMapEmpty}>
            <Icon name="place" size={22} color={P.slate400} />
            <Text style={styles.fmbMapEmptyText}>{t('farmer.profile.farm.mapEmpty')}</Text>
          </View>
        )}

        {/* GPS Tag */}
        {!farmsLoading ? (
          <View style={styles.gpsCoordinatesBadge} pointerEvents="none">
            <Text style={styles.gpsCoordinatesText}>{gpsStatusLabel}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* 4 Metrics Strip */}
      <View style={styles.fmbMetricsStrip}>
        <View style={styles.fmbMetricItem}>
          <Text style={styles.fmbMetricValue}>{farmsLoading ? '—' : farmDetails.acres}</Text>
          <Text style={styles.fmbMetricLabel}>{t('farmer.profile.stats.acres')}</Text>
        </View>
        <View style={styles.fmbMetricDivider} />
        <View style={styles.fmbMetricItem}>
          <Text style={styles.fmbMetricValue}>{farmsLoading ? '—' : farmDetails.zones}</Text>
          <Text style={styles.fmbMetricLabel}>{t('farmer.profile.farm.metric.zones')}</Text>
        </View>
        <View style={styles.fmbMetricDivider} />
        <View style={styles.fmbMetricItem}>
          <Text style={styles.fmbMetricValue}>{farmsLoading ? '—' : farmDetails.farms}</Text>
          <Text style={styles.fmbMetricLabel}>{t('farmer.profile.farm.metric.farms')}</Text>
        </View>
        <View style={styles.fmbMetricDivider} />
        <View style={styles.fmbMetricItem}>
          <Text style={styles.fmbMetricValue}>{farmsLoading ? '—' : farmDetails.fmbPts}</Text>
          <Text style={styles.fmbMetricLabel}>{t('farmer.profile.farm.metric.fmbPts')}</Text>
        </View>
      </View>

      {/* Water Source Row */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('farmer.profile.farm.waterSource')}</Text>
        <Text style={styles.detailValue}>{farmsLoading ? '—' : farmDetails.waterSource}</Text>
      </View>

      {/* Land Context Pills — only shown once tags are available */}
      {farmDetails.tags.length > 0 && (
        <View style={styles.tagPillContainer}>
          {farmDetails.tags.map((tag, i) => (
            <View key={i} style={[styles.tagPill, styles.iconTextRow, styles.tagPillGreen]}>
              <Icon name="park" size={11} color={colors.brandGreen} />
              <Text style={[styles.tagPillText, styles.tagPillTextGreen]}>{farmTagLabel(tag)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
