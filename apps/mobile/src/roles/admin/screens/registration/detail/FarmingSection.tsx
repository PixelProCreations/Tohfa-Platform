/**
 * 02 · Farm Details (step 2 of 5), drawn as the design draws it: farm name,
 * the four Type-of-Farming chips, years of experience, number of separate
 * farms, the area the farmer entered, the area the FMB sketches cover, and the
 * Area Variance box inside the card.
 *
 * The chips are a DISPLAY of the applicant's stored answer, not a control:
 * nothing here may change what the applicant said. A stored answer none of the
 * four chips names selects none of them, and is then printed in its own row so
 * it is still visible (the design has no such case).
 *
 * The variance is computed (reviewFacts.ts) only when both areas exist; the
 * design always printed one from two hard-coded acreages. When it cannot be
 * computed the box stays and its figures carry the dash.
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { Card, InfoRow, StepHeader } from '../applications/ApplicationParts';
import { farmCountLabel, orDash, yearsLabel } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';
import {
  APPLICATION_STEP_COUNT,
  AREA_VARIANCE_TOLERANCE_PERCENT,
  areaVariance,
  farmingTypeChips,
  fmbAreaAcres,
  type FarmingTypeKey,
} from './reviewFacts';

const CHIP_LABEL: Record<FarmingTypeKey, TranslationKey> = {
  natural: 'farmerApps.farmingType.natural',
  organic: 'farmerApps.farmingType.organic',
  bioDynamic: 'farmerApps.farmingType.bioDynamic',
  others: 'farmerApps.farmingType.others',
};

/** "2.50 acres": the design prints areas to two decimals. */
export function acres2(value: number | null | undefined): string {
  return value === null || value === undefined ? ADMIN_NO_VALUE : t('farmerApps.acres', { value: value.toFixed(2) });
}

function AreaDiffBox({ app }: { app: ApplicationDetailView }) {
  const variance = areaVariance(app);
  const pill =
    variance === null
      ? ADMIN_NO_VALUE
      : t('farmerApps.variance.value', {
          diff: variance.diffAcres > 0 ? `+${variance.diffAcres}` : String(variance.diffAcres),
          percent: variance.percent,
        });
  const sub =
    variance === null
      ? ADMIN_NO_VALUE
      : variance.withinTolerance
        ? t('farmerApps.variance.withinMargin', { percent: AREA_VARIANCE_TOLERANCE_PERCENT })
        : t('farmerApps.variance.needsSurveyor');
  return (
    <View style={detailStyles.areaDiffBox} testID="farmerApps.areaVariance">
      <View style={detailStyles.labelBox}>
        <Text style={detailStyles.areaDiffTitle}>{t('farmerApps.variance.title')}</Text>
        <Text style={detailStyles.areaDiffSub}>{sub}</Text>
      </View>
      <View style={detailStyles.areaDiffPill}>
        <Text style={detailStyles.areaDiffPillText}>{pill}</Text>
      </View>
    </View>
  );
}

export function FarmingSection({ app }: { app: ApplicationDetailView }) {
  const { farming } = app;
  const chips = farmingTypeChips(farming.typeOfFarming);
  const unmatched = farming.typeOfFarming !== null && !chips.some((c) => c.selected);
  return (
    <>
      <StepHeader label={t('farmerApps.section.farming')} step={2} total={APPLICATION_STEP_COUNT} />
      <Card>
        <InfoRow label={t('farmerApps.field.farmName')} value={orDash(farming.farmName)} bold />

        <View style={detailStyles.columnBox}>
          <Text style={detailStyles.label}>{t('farmerApps.field.farmingType')}</Text>
          <View style={detailStyles.farmingChipsRow}>
            {chips.map((chip) => (
              <View
                key={chip.key}
                style={[detailStyles.farmingTypeChip, chip.selected ? detailStyles.farmingTypeChipActive : null]}
                testID="farmerApps.farmingTypeChip"
                accessibilityState={{ selected: chip.selected }}
              >
                <Text style={[detailStyles.farmingTypeChipText, chip.selected ? detailStyles.farmingTypeChipTextActive : null]}>
                  {t(CHIP_LABEL[chip.key])}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Only when the stored answer is none of the four chips: the applicant's own word, so nothing is hidden. */}
        {unmatched ? <InfoRow label={t('farmerApps.field.farmingTypeStated')} value={orDash(farming.typeOfFarming)} /> : null}

        <InfoRow label={t('farmerApps.field.experience')} value={yearsLabel(farming.experienceYears)} />
        <InfoRow label={t('farmerApps.field.numberOfFarms')} value={farmCountLabel(farming.statedNumberOfFarms)} bold />
        <InfoRow label={t('farmerApps.field.statedTotalArea')} value={acres2(farming.statedAreaAcres)} bold />
        {/* Summed from the land locations' calculated areas; the dash when no location carries one. */}
        <InfoRow label={t('farmerApps.field.fmbArea')} value={acres2(fmbAreaAcres(app))} />
        <AreaDiffBox app={app} />
      </Card>
    </>
  );
}
