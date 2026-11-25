/**
 * The design's "Filter Farmers" modal: Zone chips, Status chips, Apply.
 *
 * Differences from the design, all because of the API:
 *   - Zone chips are the zones present in the loaded rows (there is no admin
 *     zones endpoint), never the design's static Coonoor/Ooty/Kotagiri; the
 *     group is hidden with fewer than two. The server scopes the list itself
 *     (BR-108a); a chip only narrows within that scope by zone id.
 *   - Status chips are the API account statuses. The design's "Inactive" is
 *     the DISABLED account status and reads "Disabled", like the card.
 *   - A Rating tier group restores Dev's "Excellent tier" filter for every
 *     tier code the API accepts.
 * A chip applies at once (as in the design); Apply closes the modal.
 */
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import {
  ALL,
  showZoneFilter,
  STATUS_FILTER_OPTIONS,
  TIER_FILTER_OPTIONS,
  type FarmersFilterState,
  type StatusFilterId,
  type TierFilterId,
  type ZoneOption,
} from './farmersListLogic';
import { styles } from './farmersListStyles';

export type FarmersFilterValues = Omit<FarmersFilterState, 'q'>;

export interface FarmersFilterModalProps {
  visible: boolean;
  values: FarmersFilterValues;
  zones: readonly ZoneOption[];
  onChange: (values: FarmersFilterValues) => void;
  onClose: () => void;
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}

function Chip({ label, selected, onPress, testID }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, selected && styles.filterChipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function FarmersFilterModal({ visible, values, zones, onChange, onClose }: FarmersFilterModalProps) {
  const setStatus = (status: StatusFilterId) => onChange({ ...values, status });
  const setTier = (tier: TierFilterId) => onChange({ ...values, tier });
  const setZone = (zoneId: string) => onChange({ ...values, zoneId });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.filterModalOverlay}>
        <View style={styles.filterModalCard}>
          <Text style={styles.filterModalTitle}>{t('farmersList.filter.title')}</Text>

          {showZoneFilter(zones) ? (
            <>
              <Text style={styles.filterSectionLabel}>{t('farmersList.filter.zone')}</Text>
              <View style={styles.filterChipRow}>
                <Chip
                  label={t('farmersList.filter.all')}
                  selected={values.zoneId === ALL}
                  onPress={() => setZone(ALL)}
                  testID="farmersList.chip.zone.ALL"
                />
                {zones.map((zone) => (
                  <Chip
                    key={zone.id}
                    label={zone.name}
                    selected={values.zoneId === zone.id}
                    onPress={() => setZone(zone.id)}
                    testID={`farmersList.chip.zone.${zone.id}`}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.filterSectionLabel}>{t('farmersList.filter.status')}</Text>
          <View style={styles.filterChipRow}>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={t(option.labelKey)}
                selected={values.status === option.id}
                onPress={() => setStatus(option.id)}
                testID={`farmersList.chip.status.${option.id}`}
              />
            ))}
          </View>

          <Text style={styles.filterSectionLabel}>{t('farmersList.filter.tier')}</Text>
          <View style={styles.filterChipRow}>
            {TIER_FILTER_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={t(option.labelKey)}
                selected={values.tier === option.id}
                onPress={() => setTier(option.id)}
                testID={`farmersList.chip.tier.${option.id}`}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.filterModalCloseBtn}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            testID="farmersList.filterApply"
          >
            <Text style={styles.filterModalCloseBtnText}>{t('farmersList.filter.apply')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
