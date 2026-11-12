import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { type AnimalGender } from '../../../../api/livestock';
import {
  breedingCycleNumber,
  calvingRows,
  deriveCurrentCycle,
  localTodayIso,
} from '../animalRecordView';
import { type useAnimalBreedingRecords } from '../useAnimalRecords';
import { styles } from './styles';
import {
  CalfCowIcon,
  PlusCircleGreenIcon,
  FormPlusIcon,
} from '../../../../assets/icons/AssetIcons';
import { ShowMoreRow, SectionState } from './shared';
import { type BreedingForm } from './BreedingModal';
import { type AnimalDetailProps } from '../AnimalDetailScreen';

export interface BreedingTabProps {
  breedingList: ReturnType<typeof useAnimalBreedingRecords>;
  canAddBreeding: boolean;
  setIsAddBreedingModalVisible: BreedingForm['setIsAddBreedingModalVisible'];
  setBreedingRecordType: BreedingForm['setBreedingRecordType'];
  onNavigateToRegisterOffspring: AnimalDetailProps['onNavigateToRegisterOffspring'];
  openRegisterOffspring: (calvingIso: string | undefined, gender: AnimalGender | null) => void;
}

/** Breeding tab (BR-138): current cycle and calving history. */
export function BreedingTab({
  breedingList,
  canAddBreeding,
  setIsAddBreedingModalVisible,
  setBreedingRecordType,
  onNavigateToRegisterOffspring,
  openRegisterOffspring,
}: BreedingTabProps): React.JSX.Element {
  const today = localTodayIso();
  const currentCycle = deriveCurrentCycle(breedingList.items, today);
  const cycleNumber = breedingCycleNumber(breedingList.items, breedingList.hasMore);
  const calvings = calvingRows(breedingList.items);

  return (
    <View style={styles.tabContentContainer}>
      {/* Top Bar with Add Button — BR-138: female animals only */}
      <View style={styles.healthTopBar}>
        <View style={styles.healthTopBarTitleCol}>
          <Text style={styles.healthTopBarTitle}>
            {t('farmer.livestock.detail.breeding.title')}
          </Text>
          <Text style={styles.healthTopBarSubtitle}>
            {t('farmer.livestock.detail.breeding.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addHealthButton, !canAddBreeding && styles.addButtonDisabled]}
          onPress={() => setIsAddBreedingModalVisible(true)}
          disabled={!canAddBreeding}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAddBreeding }}
          accessibilityLabel={t('farmer.livestock.detail.breeding.addRecord')}
          testID="animalDetail.breeding.add"
        >
          <FormPlusIcon size={15} color={P.white} />
          <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
        </TouchableOpacity>
      </View>
      {!canAddBreeding && (
        <Text style={styles.footnoteCaption} testID="animalDetail.breeding.femaleOnly">
          {t('farmer.livestock.detail.breeding.femaleOnly')}
        </Text>
      )}

      {/* Section: CURRENT CYCLE — latest heat/insemination + latest pregnancy check */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>
          {t('farmer.livestock.detail.breeding.currentCycle')}
        </Text>
        {canAddBreeding && (
          <TouchableOpacity
            onPress={() => {
              setBreedingRecordType('HEAT');
              setIsAddBreedingModalVisible(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.livestock.detail.breeding.addRecord')}
          >
            <Text style={styles.sectionHeaderAddText}>
              {t('farmer.livestock.detail.common.addInline')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {breedingList.state !== 'ready' ? (
        <SectionState list={breedingList} testID="animalDetail.breeding" />
      ) : (
        <>
          <View style={styles.whiteCardContainer} testID="animalDetail.breeding.currentCycle">
            {/* 1 + CALVING records (breedingCycleNumber); hidden until every breeding page is loaded. */}
            {cycleNumber !== null ? (
              <Text style={styles.cycleNumberText} testID="animalDetail.breeding.cycleNumber">
                {t('farmer.livestock.detail.breeding.cycleNumber', { n: cycleNumber })}
              </Text>
            ) : null}
            {currentCycle === null ? (
              <Text style={styles.itemSubtitle}>
                {t('farmer.livestock.detail.breeding.noCycle')}
              </Text>
            ) : (
              <>
                <View style={styles.cycleTopRow}>
                  <View style={styles.pregnantBadgePill}>
                    <Text style={styles.pregnantBadgeText}>{currentCycle.statusLabel}</Text>
                  </View>
                </View>

                <View style={styles.cycleGridRow}>
                  {/* Left column: Bred */}
                  <View style={styles.cycleGridCol}>
                    <Text style={styles.cycleGridLabel}>
                      {t('farmer.livestock.detail.breeding.bred')}
                    </Text>
                    <Text style={styles.cycleGridValBold}>
                      {currentCycle.bred?.date ?? t('farmer.livestock.detail.breeding.notRecorded')}
                    </Text>
                    {currentCycle.bred ? (
                      <Text style={styles.cycleGridSubtext}>{currentCycle.bred.method}</Text>
                    ) : null}
                  </View>

                  {/* Right column: Expected delivery (from the pregnancy check) */}
                  <View style={styles.cycleGridCol}>
                    <Text style={styles.cycleGridLabel}>
                      {t('farmer.livestock.detail.breeding.expectedDelivery')}
                    </Text>
                    <Text style={styles.cycleGridValBold}>
                      {currentCycle.expectedDelivery?.date ??
                        t('farmer.livestock.detail.breeding.notRecorded')}
                    </Text>
                    {currentCycle.expectedDelivery ? (
                      <Text style={styles.cycleGridCountdown}>
                        {currentCycle.expectedDelivery.countdown}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Section: CALVING HISTORY */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>
              {t('farmer.livestock.detail.breeding.calvingHistory')}
            </Text>
            {canAddBreeding && (
              <TouchableOpacity
                onPress={() => {
                  setBreedingRecordType('CALVING');
                  setIsAddBreedingModalVisible(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.livestock.detail.breeding.addRecord')}
                testID="animalDetail.breeding.addCalving"
              >
                <Text style={styles.sectionHeaderAddText}>
                  {t('farmer.livestock.detail.common.addInline')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {calvings.length === 0 ? (
            <View style={styles.whiteCardContainer}>
              <Text style={styles.itemSubtitle} testID="animalDetail.breeding.noCalving">
                {t('farmer.livestock.detail.breeding.noCalving')}
              </Text>
            </View>
          ) : (
            calvings.map((calving) => (
              <View
                key={calving.id}
                style={styles.whiteCardContainer}
                testID={`animalDetail.breeding.calving:${calving.id}`}
              >
                <View style={styles.calvingHeaderRow}>
                  <CalfCowIcon size={19} color={P.twAmber800} />
                  <Text style={styles.calvingTitle}>{calving.title}</Text>
                </View>

                <Text style={styles.calvingDescription}>{calving.description}</Text>

                {calving.canRegisterOffspring && onNavigateToRegisterOffspring ? (
                  <TouchableOpacity
                    style={styles.registerOffspringBtn}
                    onPress={() =>
                      openRegisterOffspring(calving.recordDate, calving.offspringGender)
                    }
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
          <ShowMoreRow list={breedingList} testID="animalDetail.breeding.showMore" />
        </>
      )}
    </View>
  );
}
