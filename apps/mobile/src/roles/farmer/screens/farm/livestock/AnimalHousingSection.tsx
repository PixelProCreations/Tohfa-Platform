/**
 * Housing tab of AnimalDetailScreen: Dev's design (HOUSING card with the two
 * metric boxes, welfare banner, HYGIENE LOG) filled from
 * GET .../housing-records (newest startDate = current housing) and
 * GET .../hygiene-logs instead of sample rows.
 *
 * BR-141: the "minimum" box and the verdict are the SERVER's (system_config
 * standard, exact unit conversion); nothing here compares or defaults a number.
 * While no standard is configured the server sends null: the records still
 * show, with no standard box value and no banner (never a guessed number).
 */
import React from 'react';
import { Text, View } from 'react-native';
import { authPalette as P, colors } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { BarnOutlineIcon, BroomCleaningIcon, ShieldCheckBadgeIcon } from './animalDetailIcons';
import { SectionState, ShowMoreRow, type SectionProps } from './animalDetailSectionParts';
import {
  formatDayMonth,
  formatQuantity,
  housingStandardView,
  spaceUnitLabel,
  welfareSpeciesLabel,
} from './animalRecordView';
import { useAnimalHousing, useAnimalHygieneLogs } from './useAnimalRecords';
import type { AnimalSpecies } from '../../../api/livestock';

export interface AnimalHousingSectionProps extends SectionProps {
  animalId: string;
  /** The animal's species; the banner sentence names it in the farmer's locale. */
  species: AnimalSpecies;
}

export function AnimalHousingSection({
  animalId,
  species,
  styles,
}: AnimalHousingSectionProps): React.JSX.Element {
  const housingList = useAnimalHousing(animalId, true);
  const hygieneList = useAnimalHygieneLogs(animalId, true);
  const current = housingList.items[0];
  const standard =
    housingList.firstPage !== null
      ? housingStandardView(current, housingList.firstPage.spaceStandard)
      : null;

  return (
    <View style={styles.tabContentContainer}>
      {/* Section: HOUSING */}
      <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.housing.title')}</Text>
      {housingList.state !== 'ready' || standard === null ? (
        <SectionState list={housingList} testID="animalDetail.housing" styles={styles} />
      ) : current === undefined ? (
        <View style={styles.whiteCardContainer}>
          <Text style={styles.itemSubtitle} testID="animalDetail.housing.noRecord">
            {t('farmer.livestock.detail.housing.noRecord')}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.whiteCardContainer} testID="animalDetail.housing.card">
            <View style={styles.housingHeaderRow}>
              <BarnOutlineIcon size={18} color={P.twAmber800} />
              <Text style={styles.housingHeaderTitle}>{current.housingName}</Text>
            </View>

            {/* 2 Stat metric boxes */}
            <View style={styles.housingBoxesRow}>
              <View style={styles.housingMetricBox}>
                <View style={styles.metricValRow}>
                  <Text style={styles.metricValNumber}>
                    {formatQuantity(current.indoorSpacePerAnimal.value)}
                  </Text>
                  <Text style={styles.metricValUnit}>
                    {spaceUnitLabel(current.indoorSpacePerAnimal.unit)}
                  </Text>
                </View>
                <Text style={styles.metricValLabel}>
                  {t('farmer.livestock.detail.housing.perAnimal')}
                </Text>
              </View>

              {standard.value !== null ? (
                <View style={styles.housingMetricBox} testID="animalDetail.housing.standard">
                  <View style={styles.metricValRow}>
                    <Text style={styles.metricValNumber}>
                      {t('farmer.livestock.detail.housing.standardValue', {
                        value: standard.value,
                      })}
                    </Text>
                    <Text style={styles.metricValUnit}>{standard.unit}</Text>
                  </View>
                  <Text style={styles.metricValLabel}>
                    {t('farmer.livestock.detail.housing.standardLabel')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Welfare standards compliance banner: Dev's design only has the "meets" state. */}
          {standard.verdict === 'meets' ? (
            <View style={styles.welfareNoticeCard} testID="animalDetail.housing.verdict.meets">
              <ShieldCheckBadgeIcon size={20} />
              <View style={styles.welfareNoticeCol}>
                <Text style={styles.welfareNoticeTitle}>
                  {t('farmer.livestock.detail.housing.welfareTitle')}
                </Text>
                <Text style={styles.welfareNoticeSubtitle}>
                  {t('farmer.livestock.detail.housing.welfareSubtitle', { species: welfareSpeciesLabel(species) })}
                </Text>
              </View>
            </View>
          ) : null}
        </>
      )}

      {/* Section: HYGIENE LOG */}
      <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.housing.hygiene')}</Text>
      {hygieneList.state !== 'ready' ? (
        <SectionState
          list={hygieneList}
          testID="animalDetail.housing.hygieneState"
          styles={styles}
        />
      ) : (
        <View style={styles.whiteCardContainer}>
          {hygieneList.items.length === 0 ? (
            <Text style={styles.itemSubtitle} testID="animalDetail.housing.noHygiene">
              {t('farmer.livestock.detail.housing.noHygiene')}
            </Text>
          ) : (
            hygieneList.items.map((log, idx) => (
              <React.Fragment key={log.id}>
                {idx > 0 && <View style={styles.dividerLine} />}
                <View style={styles.itemRow} testID={`animalDetail.housing.hygiene:${log.id}`}>
                  <View style={styles.greenIconSquare}>
                    <BroomCleaningIcon size={17} color={colors.brandGreen} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>{log.activity}</Text>
                    <Text style={styles.itemSubtitle}>{formatDayMonth(log.performedOn)}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
        </View>
      )}
      <ShowMoreRow
        list={hygieneList}
        testID="animalDetail.housing.hygiene.showMore"
        styles={styles}
      />
    </View>
  );
}
