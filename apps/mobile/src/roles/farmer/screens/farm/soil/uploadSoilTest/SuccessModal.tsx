import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authPalette as P } from '../../../../theme';
import { ICON, RANGES } from './constants';
import { CheckCircleIcon, DocIcon } from './icons';
import { limeLabel } from './LimeStatusField';
import { st } from './i18n';
import { styles } from './styles';
import type { SavedSoilTestData } from './useSoilTestForm';

interface Props {
  data: SavedSoilTestData | null;
  onClose: () => void;
}

const EMPTY_VALUE = '-';
const NUTRIENT_KEYS = ['N:', 'P:', 'K:', 'TDS:'] as const;

function Chip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.nutrientChip}>
      <Text style={styles.nutrientChipKey}>{label}</Text>
      <Text style={styles.nutrientChipVal}>{`${value} ${unit}`}</Text>
    </View>
  );
}

export function SuccessModal({ data, onClose }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const ph = data?.ph ?? RANGES.phFallback;
  const oc = data?.oc ?? 0;
  const ec = data?.ec ?? 0;
  const phBad = ph < RANGES.ph.low;
  const phGood = ph <= RANGES.ph.high;
  const ocLow = oc < RANGES.oc.low;
  const ocMid = oc <= RANGES.oc.high;
  const ecGood = ec <= RANGES.ecGood;
  const ecSlight = ec <= RANGES.ecSlight;
  const kgPerHa = st('success.unit.kgPerHa');

  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={!!data} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.successModalOverlay, { paddingBottom: insets.bottom }]}>
        <View style={styles.successModalCard}>
          <View style={styles.successIconCircle}>
            <CheckCircleIcon size={ICON.large} color={P.twGreen700} />
          </View>

          <Text style={styles.successModalTitle}>{st('success.title')}</Text>
          <Text style={styles.successModalSubtitle}>{st('success.subtitle')}</Text>

          <View style={styles.successDataBox}>
            <View style={styles.successDataRow}>
              <View style={styles.successDataCol}>
                <Text style={styles.successColLabel}>{st('success.testDate')}</Text>
                <Text style={styles.successColVal}>{data?.testDate || EMPTY_VALUE}</Text>
              </View>
              <View style={styles.successDataCol}>
                <Text style={styles.successColLabel}>{st('success.nextDue')}</Text>
                <Text style={styles.successColVal}>{data?.nextDue || EMPTY_VALUE}</Text>
              </View>
            </View>

            <View style={styles.successDivider} />

            <View style={styles.successMetricsGrid}>
              <View style={styles.successMetricItem}>
                <Text style={styles.successMetricLabel}>{st('field.ph')}</Text>
                <Text style={styles.successMetricVal}>{data?.ph}</Text>
                <Text
                  style={[
                    styles.successMetricBadge,
                    phBad ? styles.badgeWarning : phGood ? styles.badgeGood : styles.badgeWarning,
                  ]}
                >
                  {phBad
                    ? st('success.badge.acidic')
                    : phGood
                    ? st('success.badge.good')
                    : st('success.badge.alkaline')}
                </Text>
              </View>

              <View style={styles.successMetricItem}>
                <Text style={styles.successMetricLabel}>OC</Text>
                <Text style={styles.successMetricVal}>{data?.oc}%</Text>
                <Text
                  style={[
                    styles.successMetricBadge,
                    ocLow ? styles.badgeWarning : ocMid ? styles.badgeGood : styles.badgeInfo,
                  ]}
                >
                  {ocLow
                    ? st('success.badge.low')
                    : ocMid
                    ? st('success.badge.medium')
                    : st('success.badge.high')}
                </Text>
              </View>

              <View style={styles.successMetricItem}>
                <Text style={styles.successMetricLabel}>EC</Text>
                <Text style={styles.successMetricVal}>
                  {data?.ec} <Text style={styles.successUnitText}>{st('success.unit.ecDsPerM')}</Text>
                </Text>
                <Text
                  style={[
                    styles.successMetricBadge,
                    ecGood ? styles.badgeGood : ecSlight ? styles.badgeWarning : styles.badgeDanger,
                  ]}
                >
                  {ecGood
                    ? st('success.badge.normal')
                    : ecSlight
                    ? st('success.badge.slight')
                    : st('success.badge.saline')}
                </Text>
              </View>
            </View>

            {data &&
            (data.nitrogen != null ||
              data.phosphorus != null ||
              data.potassium != null ||
              data.tds != null) ? (
              <>
                <View style={styles.successDivider} />
                <View style={styles.successNutrientsGrid}>
                  {data.nitrogen != null && (
                    <Chip label={NUTRIENT_KEYS[0]} value={data.nitrogen} unit={kgPerHa} />
                  )}
                  {data.phosphorus != null && (
                    <Chip label={NUTRIENT_KEYS[1]} value={data.phosphorus} unit={kgPerHa} />
                  )}
                  {data.potassium != null && (
                    <Chip label={NUTRIENT_KEYS[2]} value={data.potassium} unit={kgPerHa} />
                  )}
                  {data.tds != null && (
                    <Chip label={NUTRIENT_KEYS[3]} value={data.tds} unit={st('success.unit.ppm')} />
                  )}
                </View>
              </>
            ) : null}

            <View style={styles.successDivider} />
            <View style={styles.successContextRow}>
              <Text style={styles.successContextLabel}>{st('success.limeStatus')}</Text>
              <Text style={styles.successContextVal}>
                {data?.limeStatus ? limeLabel(data.limeStatus) : st('lime.notApplied')}
              </Text>
            </View>
            {data?.waterSources ? (
              <View style={styles.successContextRow}>
                <Text style={styles.successContextLabel}>{st('success.waterSource')}</Text>
                <Text style={styles.successContextVal} numberOfLines={1}>
                  {data.waterSources}
                </Text>
              </View>
            ) : null}
            {data?.documentName ? (
              <View style={styles.successContextRow}>
                <Text style={styles.successContextLabel}>{st('success.report')}</Text>
                <View style={styles.docReportValueBox}>
                  <DocIcon size={ICON.tiny} color={P.twGreen700} />
                  <Text
                    style={[styles.successContextVal, styles.successReportVal]}
                    numberOfLines={1}
                  >
                    {data.documentName}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.successModalOkBtn}
            onPress={onClose}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={st('success.ok')}
          >
            <Text style={styles.successModalOkBtnText}>{st('success.ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
