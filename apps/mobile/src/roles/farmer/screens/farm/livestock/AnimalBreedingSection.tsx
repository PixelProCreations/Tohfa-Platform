/**
 * Breeding tab of AnimalDetailScreen: Dev's design (CURRENT CYCLE card, CALVING
 * HISTORY with "Register offspring") filled from GET .../breeding-records
 * instead of sample rows. The cycle number is derived (1 + CALVING records,
 * see breedingCycleNumber) and hidden while older pages are unloaded.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P, colors } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import type { AnimalGender } from '../../../api/livestock';
import { CalfCowIcon, PlusCircleGreenIcon } from './animalDetailIcons';
import { SectionState, ShowMoreRow, type SectionProps } from './animalDetailSectionParts';
import { breedingCycleNumber, calvingRows, deriveCurrentCycle, localTodayIso } from './animalRecordView';
import { useAnimalBreedingRecords } from './useAnimalRecords';

export interface AnimalBreedingSectionProps extends SectionProps {
  animalId: string;
  /** Opens Register Animal pre-filled for this calving's newborn; the button is hidden without it. */
  onRegisterOffspring?: ((calvingIso: string, gender: AnimalGender | null) => void) | undefined;
}

export function AnimalBreedingSection({
  animalId,
  onRegisterOffspring,
  styles,
}: AnimalBreedingSectionProps): React.JSX.Element {
  const breedingList = useAnimalBreedingRecords(animalId, true);
  const currentCycle = deriveCurrentCycle(breedingList.items, localTodayIso());
  const cycleNumber = breedingCycleNumber(breedingList.items, breedingList.hasMore);
  const calvings = calvingRows(breedingList.items);

  return (
    <View style={styles.tabContentContainer}>
      {/* Section: CURRENT CYCLE */}
      <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.breeding.currentCycle')}</Text>
      {breedingList.state !== 'ready' ? (
        <SectionState list={breedingList} testID="animalDetail.breeding" styles={styles} />
      ) : (
        <>
          <View style={styles.whiteCardContainer} testID="animalDetail.breeding.currentCycle">
            {currentCycle === null ? (
              <Text style={styles.itemSubtitle} testID="animalDetail.breeding.noCycle">
                {t('farmer.livestock.detail.breeding.noCycle')}
              </Text>
            ) : (
              <>
                <View style={styles.cycleTopRow}>
                  <View style={styles.pregnantBadgePill}>
                    <Text style={styles.pregnantBadgeText}>{currentCycle.statusLabel}</Text>
                  </View>
                  {cycleNumber !== null ? (
                    <Text style={styles.cycleCountText} testID="animalDetail.breeding.cycleNumber">
                      {t('farmer.livestock.detail.breeding.cycleNumber', { n: cycleNumber })}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.cycleGridRow}>
                  {/* Left column: Bred */}
                  <View style={styles.cycleGridCol}>
                    <Text style={styles.cycleGridLabel}>{t('farmer.livestock.detail.breeding.bred')}</Text>
                    <Text style={styles.cycleGridValBold}>
                      {currentCycle.bred?.date ?? t('farmer.livestock.detail.breeding.notRecorded')}
                    </Text>
                    {currentCycle.bred ? <Text style={styles.cycleGridSubtext}>{currentCycle.bred.method}</Text> : null}
                  </View>

                  {/* Right column: Expected delivery */}
                  <View style={styles.cycleGridCol}>
                    <Text style={styles.cycleGridLabel}>{t('farmer.livestock.detail.breeding.expectedDelivery')}</Text>
                    <Text style={styles.cycleGridValBold}>
                      {currentCycle.expectedDelivery?.date ?? t('farmer.livestock.detail.breeding.notRecorded')}
                    </Text>
                    {currentCycle.expectedDelivery ? (
                      <Text style={styles.cycleGridCountdown}>{currentCycle.expectedDelivery.countdown}</Text>
                    ) : null}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Section: CALVING HISTORY */}
          <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.breeding.calvingHistory')}</Text>
          {calvings.length === 0 ? (
            <View style={styles.whiteCardContainer}>
              <Text style={styles.itemSubtitle} testID="animalDetail.breeding.noCalving">
                {t('farmer.livestock.detail.breeding.noCalving')}
              </Text>
            </View>
          ) : (
            calvings.map((calving) => (
              <View key={calving.id} style={styles.whiteCardContainer} testID={`animalDetail.breeding.calving:${calving.id}`}>
                <View style={styles.calvingHeaderRow}>
                  <CalfCowIcon size={19} color={P.twAmber800} />
                  <Text style={styles.calvingTitle}>{calving.title}</Text>
                </View>

                <Text style={styles.calvingDescription}>{calving.description}</Text>

                {calving.canRegisterOffspring && onRegisterOffspring ? (
                  <TouchableOpacity
                    style={styles.registerOffspringBtn}
                    onPress={() => onRegisterOffspring(calving.recordDate, calving.offspringGender)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    testID={`animalDetail.breeding.registerOffspring:${calving.id}`}
                  >
                    <PlusCircleGreenIcon size={18} color={colors.brandGreen} />
                    <Text style={styles.registerOffspringBtnText}>
                      {t('farmer.livestock.detail.breeding.registerOffspring')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
          <ShowMoreRow list={breedingList} testID="animalDetail.breeding.showMore" styles={styles} />
        </>
      )}
    </View>
  );
}
