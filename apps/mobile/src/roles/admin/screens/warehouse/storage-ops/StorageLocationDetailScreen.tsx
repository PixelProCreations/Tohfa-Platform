import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getStorageLocation } from '../../../api/storageLocations';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from '../shared/AsyncStates';
import {
  LockIcon,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { STORAGE_CODES } from './StorageParts';
import type { WarehouseScreenBaseProps } from './types';

function BoxOutlineIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface StorageLocationDetailScreenProps extends WarehouseScreenBaseProps {
  locationId?: string | undefined;
  onViewStock?: (() => void) | undefined;
  onViewActivity?: (() => void) | undefined;
}

export function StorageLocationDetailScreen({
  scope,
  can,
  locationId,
  onBack,
  onViewStock,
}: StorageLocationDetailScreenProps) {
  const warehouseId = scope.warehouseId;
  const canView = can(STORAGE_CODES.batchView);

  const locationQuery = useAdminQuery(
    adminKeys.detail('storageLocations', locationId ?? 'none'),
    (signal) => getStorageLocation(warehouseId as string, locationId as string, signal),
    { enabled: !!warehouseId && !!locationId && canView },
  );

  const whName = scope?.warehouseName ?? '';

  if (!locationId || !warehouseId) {
    return (
      <WalletScreen title={t('storageOps.locations.detailTitle')} onBack={onBack}>
        <AdminEmptyState
          title={t('storageOps.locations.missing')}
          subtitle={t('storageOps.locations.emptyHint')}
        />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title={t('storageOps.locations.detailTitle')}
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {locationQuery.isLoading ? (
          <AdminLoadingState />
        ) : locationQuery.error ? (
          <AdminErrorState error={locationQuery.error} onRetry={() => locationQuery.refetch()} />
        ) : locationQuery.data ? (
          <>
            <View style={styles.scopeRow}>
              <LockIcon size={14} color={adminColors.muted} />
              <Text style={styles.scopeText}>{whName}</Text>
            </View>

            <Text style={styles.locationTitle}>{`${locationQuery.data.name} — ${locationQuery.data.code}`}</Text>

            <View style={styles.card}>
              <View style={styles.infoGridRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>{t('storageOps.capacity.status')}</Text>
                  <Text style={styles.infoValue}>
                    {locationQuery.data.isActive ? t('storageOps.locations.active') : t('storageOps.locations.inactive')}
                  </Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>{t('storageOps.locations.capacity')}</Text>
                  <Text style={styles.infoValue}>
                    {locationQuery.data.capacityKg ? formatKg(parseKgToGrams(locationQuery.data.capacityKg) ?? 0) : '—'}
                  </Text>
                </View>
              </View>
              <View style={[styles.infoGridRow, styles.infoGridRowSpaced]}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>{t('storageOps.locations.currentOccupancy')}</Text>
                  <Text style={styles.infoValue}>
                    {formatKg(parseKgToGrams(locationQuery.data.usedKg) ?? 0)}
                  </Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>{t('storageOps.locations.available')}</Text>
                  <Text style={styles.infoValue}>
                    {(() => {
                      const capG = locationQuery.data.capacityKg ? (parseKgToGrams(locationQuery.data.capacityKg) ?? 0) : 0;
                      const usedG = parseKgToGrams(locationQuery.data.usedKg) ?? 0;
                      return formatKg(Math.max(0, capG - usedG));
                    })()}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('storageOps.locations.locationUsage')}</Text>
            <View style={styles.usageCard}>
              <View style={styles.usageRow}>
                <Text style={styles.usageItemName}>
                  {t('storageOps.locations.usageSummary', {
                    batches: locationQuery.data.batchCount,
                    qty: formatKg(parseKgToGrams(locationQuery.data.usedKg) ?? 0),
                  })}
                </Text>
              </View>
            </View>

            {canView && onViewStock ? (
              <TouchableOpacity
                style={styles.viewStockButton}
                onPress={onViewStock}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('storageOps.locations.viewStock')}
              >
                <BoxOutlineIcon size={20} color={adminColors.onBrand} />
                <Text style={styles.viewStockButtonText}>{t('storageOps.locations.viewStock')}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <AdminEmptyState title={t('storageOps.locations.missing')} />
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: 40,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  scopeText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  locationTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.lg,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.xl,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoGridRowSpaced: {
    marginTop: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  infoValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  usageCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 4,
    marginBottom: adminSpacing.xl,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  usageItemName: {
    ...adminType.body,
    color: adminColors.ink,
  },
  viewStockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: 50,
    gap: adminSpacing.xs,
  },
  viewStockButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});