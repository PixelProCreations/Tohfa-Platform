/**
 * Farm FMB & Zones for one farmer, from GET /admin/farmers/{id}.
 *
 * The API carries no plot geometry: a land location has only a centroid and a
 * `hasBoundary` flag, and a plot (a "zone" of the farm) has a name, area and
 * soil/irrigation/sun fields. So the map draws no pins (none would be real)
 * and says so; the zone list is the farmer's real plots; the FMB line reads
 * the server's `hasBoundary`, never a blanket claim.
 */
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useFarmer } from '../../api/farmerHooks';
import { t } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import type { FarmerListItem } from './AdminAllFarmersScreen';

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
}

export const AdminFarmMapScreen: React.FC<Props> = ({ farmer, onBack }) => {
  const detail = useFarmer(undefined, farmer.id);
  const locations = detail.farmer?.landLocations ?? [];
  const plots = locations.flatMap((loc) => loc.plots.map((plot) => ({ plot, location: loc })));

  const farmTitle = [farmer.name, farmer.farmName].filter(Boolean).join(' · ');
  const regionText = farmer.zone ? t('wiringFarmers.map.region', { zone: farmer.zone }) : ADMIN_NO_VALUE;

  const boundaryCount = locations.filter((loc) => loc.hasBoundary).length;
  const fmbText =
    detail.farmer === undefined
      ? ADMIN_NO_VALUE
      : boundaryCount > 0
        ? t('wiringFarmers.map.fmbRecorded', { count: boundaryCount, total: locations.length })
        : t('wiringFarmers.map.fmbNone');

  const renderZones = () => {
    if (detail.isLoading) return <AdminLoadingState />;
    if (detail.error) return <AdminErrorState error={detail.error} onRetry={detail.refresh} />;
    if (plots.length === 0) return <AdminEmptyState title={t('wiringFarmers.map.noZones')} />;
    return plots.map(({ plot, location }, idx) => (
      <View key={plot.id} style={styles.zoneCard}>
        <View style={styles.zoneBadge}>
          <Text style={styles.zoneBadgeText}>{t('wiringFarmers.map.zoneBadge', { index: idx + 1 })}</Text>
        </View>
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneName}>{plot.name}</Text>
          <Text style={styles.zoneSub}>
            {t('wiringFarmers.map.zoneSub', {
              location: location.name,
              area: plot.areaAcres === null ? ADMIN_NO_VALUE : t('wiringFarmers.map.acres', { value: plot.areaAcres }),
            })}
          </Text>
        </View>
      </View>
    ));
  };

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
        {/* Title & Subtitle */}
        <Text style={styles.title}>{t('wiringFarmers.map.title')}</Text>
        <Text style={styles.subtitle}>
          {farmTitle || ADMIN_NO_VALUE} · {regionText}
        </Text>

        {/* Map Card: no geometry in the API, so an empty map, no pins. */}
        <View style={styles.mapCard}>
          <Svg width="100%" height={210} viewBox="0 0 340 210">
            <Path d="M 0 0 L 340 0 L 340 210 L 0 210 Z" fill={adminColors.brandDeep} />
          </Svg>

          <View style={styles.mapFooter}>
            <Text style={styles.mapFooterText}>{t('wiringFarmers.map.noGeometry')}</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>{t('wiringFarmers.map.zonesTitle')}</Text>

        {renderZones()}

        {/* Field Context Callout: the server's hasBoundary flag. */}
        <View style={styles.contextBanner}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.contextIcon}>
            <Path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              stroke={adminColors.brand}
              strokeWidth="2"
            />
          </Svg>
          <Text style={styles.contextText}>
            <Text style={styles.contextTextBold}>{t('wiringFarmers.map.fieldContext')}</Text>
            {fmbText}
          </Text>
        </View>

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
    paddingTop: adminSpacing.md,
  },
  title: {
    ...adminType.title,
    fontSize: 26,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...adminType.caption,
    lineHeight: 19,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  mapCard: {
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: adminSpacing.lg,
  },
  mapFooter: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    backgroundColor: 'transparent',
  },
  mapFooterText: {
    color: 'rgba(255, 255, 255, 0.85)',
    ...adminType.caption,
    fontWeight: '500',
  },
  sectionTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  zoneBadge: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  zoneBadgeText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 3,
  },
  zoneSub: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },
  contextIcon: {
    marginRight: adminSpacing.sm,
    marginTop: 1,
  },
  contextText: {
    flex: 1,
    ...adminType.caption,
    lineHeight: 18,
    color: adminColors.ink,
  },
  contextTextBold: {
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
});
