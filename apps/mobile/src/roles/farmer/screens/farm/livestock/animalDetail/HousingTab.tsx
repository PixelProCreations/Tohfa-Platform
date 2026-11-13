import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { housingStandardView, housingTypeLabel, spaceUnitLabel } from '../animalRecordView';
import { type useAnimalHousing, type useAnimalHygieneLogs } from '../useAnimalRecords';
import { styles } from './styles';
import {
  ProhibitedCircleIcon,
  BarnOutlineIcon,
  ShieldCheckBadgeIcon,
  BroomCleaningIcon,
  FormPlusIcon,
} from '../../../../assets/icons/AssetIcons';
import { ShowMoreRow, SectionState, formatShortDate } from './shared';
import { type HousingForm } from './HousingModal';

export interface HousingTabProps {
  housingList: ReturnType<typeof useAnimalHousing>;
  hygieneList: ReturnType<typeof useAnimalHygieneLogs>;
  setIsAddHousingModalVisible: HousingForm['setIsAddHousingModalVisible'];
  openHygieneModal: () => void;
}

/** Housing tab: current housing, the BR-140 space verdict and the hygiene log. */
export function HousingTab({
  housingList,
  hygieneList,
  setIsAddHousingModalVisible,
  openHygieneModal,
}: HousingTabProps): React.JSX.Element {
  // The housing list is startDate DESC with limit 1: its only row is the current housing.
  const currentHousing = housingList.items[0];
  const housingStandard = housingList.firstPage
    ? housingStandardView(currentHousing, housingList.firstPage.spaceStandard)
    : null;

  return (
    <View style={styles.tabContentContainer}>
      {/* Top Bar with Add Button */}
      <View style={styles.healthTopBar}>
        <View style={styles.healthTopBarTitleCol}>
          <Text style={styles.healthTopBarTitle}>{t('farmer.livestock.detail.housing.title')}</Text>
          <Text style={styles.healthTopBarSubtitle}>
            {t('farmer.livestock.detail.housing.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addHealthButton}
          onPress={() => setIsAddHousingModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.livestock.detail.housing.addRecord')}
          testID="animalDetail.housing.add"
        >
          <FormPlusIcon size={15} color={P.white} />
          <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Section: HOUSING — the newest housing record is the current one */}
      <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.housing.section')}</Text>
      {housingList.state !== 'ready' ? (
        <SectionState list={housingList} testID="animalDetail.housing.record" />
      ) : currentHousing === undefined ? (
        <View style={styles.whiteCardContainer}>
          <Text style={styles.itemSubtitle} testID="animalDetail.housing.noRecord">
            {t('farmer.livestock.detail.housing.noRecord')}
          </Text>
        </View>
      ) : (
        <View style={styles.whiteCardContainer} testID="animalDetail.housing.card">
          <View style={styles.housingHeaderRow}>
            <BarnOutlineIcon size={18} color={P.twAmber800} />
            <Text style={styles.housingHeaderTitle}>
              {t('farmer.livestock.detail.housing.cardTitle', {
                type: housingTypeLabel(currentHousing.housingType),
                name: currentHousing.housingName,
              })}
            </Text>
          </View>

          {/* 2 Stat metric boxes */}
          <View style={styles.housingBoxesRow}>
            <View style={styles.housingMetricBox}>
              <View style={styles.metricValRow}>
                <Text style={styles.metricValNumber}>
                  {currentHousing.indoorSpacePerAnimal.value}
                </Text>
                <Text style={styles.metricValUnit}>
                  {spaceUnitLabel(currentHousing.indoorSpacePerAnimal.unit)}
                </Text>
              </View>
              <Text style={styles.metricValLabel}>
                {t('farmer.livestock.detail.housing.perAnimal')}
              </Text>
            </View>

            {/* BR-140: the server's indoor space standard (system_config), never a constant */}
            {housingStandard !== null ? (
              <View style={styles.housingMetricBox} testID="animalDetail.housing.standard">
                <View style={styles.metricValRow}>
                  <Text style={styles.metricValNumber}>
                    {t('farmer.livestock.detail.housing.standardValue', {
                      value: housingStandard.value,
                    })}
                  </Text>
                  <Text style={styles.metricValUnit}>{housingStandard.unit}</Text>
                </View>
                <Text style={styles.metricValLabel}>
                  {t('farmer.livestock.detail.housing.standardLabel')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* BR-140 verdict for the current (newest startDate) housing record: the server's
          meetsIndoorSpaceStandard, one standard for every species. Shown only once the list
          (and with it the standard) has loaded; a 503 shows the section error above instead. */}
      {housingList.state !== 'ready' || housingStandard === null
        ? null
        : (() => {
            switch (housingStandard.verdict) {
              case 'meets':
                return (
                  <View
                    style={styles.welfareNoticeCard}
                    testID="animalDetail.housing.verdict.meets"
                  >
                    <ShieldCheckBadgeIcon size={20} />
                    <View style={styles.welfareNoticeCol}>
                      <Text style={styles.welfareNoticeTitle}>
                        {t('farmer.livestock.detail.housing.verdict.meetsTitle')}
                      </Text>
                      <Text style={styles.welfareNoticeSubtitle}>
                        {t('farmer.livestock.detail.housing.verdict.meetsBody', {
                          value: housingStandard.value,
                          unit: housingStandard.unit,
                        })}
                      </Text>
                    </View>
                  </View>
                );
              case 'below':
                return (
                  <View
                    style={styles.housingWarningCard}
                    testID="animalDetail.housing.verdict.below"
                  >
                    <ProhibitedCircleIcon size={20} color={P.twOrange700} />
                    <View style={styles.welfareNoticeCol}>
                      <Text style={styles.housingWarningTitle}>
                        {t('farmer.livestock.detail.housing.verdict.belowTitle')}
                      </Text>
                      <Text style={styles.housingWarningSubtitle}>
                        {t('farmer.livestock.detail.housing.verdict.belowBody', {
                          value: housingStandard.value,
                          unit: housingStandard.unit,
                        })}
                      </Text>
                    </View>
                  </View>
                );
              default:
                return (
                  <View
                    style={styles.housingNeutralCard}
                    testID="animalDetail.housing.verdict.notRecorded"
                  >
                    <View style={styles.welfareNoticeCol}>
                      <Text style={styles.housingNeutralTitle}>
                        {t('farmer.livestock.detail.housing.verdict.notRecordedTitle')}
                      </Text>
                      <Text style={styles.welfareNoticeSubtitle}>
                        {t('farmer.livestock.detail.housing.verdict.notRecordedBody', {
                          value: housingStandard.value,
                          unit: housingStandard.unit,
                        })}
                      </Text>
                    </View>
                  </View>
                );
            }
          })()}

      {/* Section: HYGIENE LOG — "+ Add" opens the hygiene-log modal */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>
          {t('farmer.livestock.detail.housing.hygieneLog')}
        </Text>
        <TouchableOpacity
          onPress={openHygieneModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.livestock.detail.housing.addHygiene')}
          testID="animalDetail.housing.addHygiene"
        >
          <Text style={styles.sectionHeaderAddText}>
            {t('farmer.livestock.detail.common.addInline')}
          </Text>
        </TouchableOpacity>
      </View>
      {hygieneList.state !== 'ready' ? (
        <SectionState list={hygieneList} testID="animalDetail.housing.hygiene" />
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
                    <Text style={styles.itemSubtitle}>{formatShortDate(log.performedOn)}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
        </View>
      )}
      <ShowMoreRow list={hygieneList} testID="animalDetail.housing.showMore" />
    </View>
  );
}
