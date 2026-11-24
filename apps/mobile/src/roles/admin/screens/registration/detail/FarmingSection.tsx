/**
 * 02 · Farm details (step 2), in the 2026-11-19 design's layout: farm name,
 * the four farming-type chips, years of experience, number of separate farms,
 * the two land areas and the variance between them, water source and crops.
 *
 * The chips are a DISPLAY of the applicant's stored answer, not a control:
 * nothing on this screen may change what the applicant said, so they are
 * plain views with the stored value selected. The raw value stays in its own
 * row, so an answer none of the four chips names is still visible.
 *
 * The variance box is computed (detail/reviewFacts.ts) and appears only when
 * both areas exist and differ. The design always drew a verdict, from two
 * hard-coded acreages; a verdict we cannot compute is not drawn at all, and
 * whichever figure is missing shows the dash.
 *
 * The Approved state's "Declaration" row has no API source, so it dashes.
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import { Card, InfoRow, StepHeader } from '../applications/ApplicationParts';
import { acresLabel, farmCountLabel, notAvailable, orDash, yearsLabel } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';
import {
  APPLICATION_STEP_COUNT,
  areaVariance,
  farmingTypeChips,
  fmbAreaAcres,
  stepState,
  type FarmingTypeKey,
} from './reviewFacts';

const CHIP_LABEL: Record<FarmingTypeKey, TranslationKey> = {
  natural: 'farmerApps.farmingType.natural',
  organic: 'farmerApps.farmingType.organic',
  bioDynamic: 'farmerApps.farmingType.bioDynamic',
  others: 'farmerApps.farmingType.others',
};

/** The design's chip row, read-only: a display of the stored answer. */
function FarmingTypeChips({ typeOfFarming }: { typeOfFarming: string | null }) {
  return (
    <View style={detailStyles.farmingChipRow}>
      {farmingTypeChips(typeOfFarming).map((chip) => (
        <View
          key={chip.key}
          style={[detailStyles.farmingChip, chip.selected ? detailStyles.farmingChipSelected : null]}
          testID="farmerApps.farmingTypeChip"
        >
          <Text style={[detailStyles.farmingChipText, chip.selected ? detailStyles.farmingChipTextSelected : null]}>
            {t(CHIP_LABEL[chip.key])}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AreaVarianceBox({ app }: { app: ApplicationDetailView }) {
  const variance = areaVariance(app);
  if (variance === null) return null;
  const diff = variance.diffAcres > 0 ? `+${variance.diffAcres}` : String(variance.diffAcres);
  return (
    <View
      style={[detailStyles.varianceBox, variance.withinTolerance ? detailStyles.varianceBoxOk : null]}
      testID="farmerApps.areaVariance"
    >
      <View style={detailStyles.varianceTextBox}>
        <Text style={detailStyles.varianceTitle}>{t('farmerApps.variance.title')}</Text>
        <Text style={detailStyles.varianceSub}>
          {variance.withinTolerance
            ? t('farmerApps.variance.withinMargin', { percent: variance.percent })
            : t('farmerApps.variance.needsSurveyor')}
        </Text>
      </View>
      <View style={detailStyles.variancePill}>
        <Text style={detailStyles.variancePillText}>{t('farmerApps.variance.value', { diff, percent: variance.percent })}</Text>
      </View>
    </View>
  );
}

export function FarmingSection({ app, approved }: { app: ApplicationDetailView; approved: boolean }) {
  const { farming } = app;
  return (
    <>
      <StepHeader
        label={t('farmerApps.section.farming')}
        step={2}
        total={APPLICATION_STEP_COUNT}
        state={stepState(app, 2)}
      />
      <Card>
        <InfoRow label={t('farmerApps.field.farmName')} value={orDash(farming.farmName)} />
        <InfoRow label={t('farmerApps.field.farmingType')} value={orDash(farming.typeOfFarming)} />
        <View style={detailStyles.chipBlock}>
          <FarmingTypeChips typeOfFarming={farming.typeOfFarming} />
        </View>
        <InfoRow label={t('farmerApps.field.experience')} value={yearsLabel(farming.experienceYears)} />
        <InfoRow label={t('farmerApps.field.numberOfFarms')} value={farmCountLabel(farming.statedNumberOfFarms)} />
        <InfoRow label={t('farmerApps.field.statedTotalArea')} value={acresLabel(farming.statedAreaAcres)} />
        {/* Summed from the land locations' calculated areas; the dash when no location carries one. */}
        <InfoRow label={t('farmerApps.field.fmbArea')} value={acresLabel(fmbAreaAcres(app))} />
        <InfoRow label={t('farmerApps.field.waterSource')} value={orDash(farming.waterSource)} />
        <InfoRow label={t('farmerApps.field.crops')} value={orDash(farming.primaryCrops.join(', '))} last={!approved} />
        {approved ? <InfoRow label={t('farmerApps.field.declaration')} value={notAvailable()} last /> : null}
      </Card>
      <AreaVarianceBox app={app} />
    </>
  );
}
