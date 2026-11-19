import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { type AnimalResponse } from '../../../../api/livestock';
import {
  localTodayIso,
  milkSeries,
  productionRow,
  sparklinePath,
  todayMilk,
} from '../animalRecordView';
import { type useAnimalMilkWindow, type useAnimalProductionLogs } from '../useAnimalRecords';
import { styles } from './styles';
import {
  ProhibitedCircleIcon,
  MilkDropletIcon,
  FormPlusIcon,
} from '../../../../assets/icons/AssetIcons';
import { ShowMoreRow, SectionState, formatShortDate } from './shared';
import { type ProductionForm } from './ProductionModal';

export interface ProductionTabProps {
  milkWindow: ReturnType<typeof useAnimalMilkWindow>;
  productionList: ReturnType<typeof useAnimalProductionLogs>;
  withdrawalActive: boolean;
  animal: AnimalResponse;
  setIsAddProductionModalVisible: ProductionForm['setIsAddProductionModalVisible'];
}

/** Production tab: today's milk, the 7-day trend and the production log. */
export function ProductionTab({
  milkWindow,
  productionList,
  withdrawalActive,
  animal,
  setIsAddProductionModalVisible,
}: ProductionTabProps): React.JSX.Element {
  const today = localTodayIso();
  const milkToday = todayMilk(milkWindow.items, today);
  const milkTrend = milkSeries(milkWindow.items, today);

  return (
    <View style={styles.tabContentContainer}>
      {/* Top Bar with Add Button */}
      <View style={styles.healthTopBar}>
        <View style={styles.healthTopBarTitleCol}>
          <Text style={styles.healthTopBarTitle}>
            {t('farmer.livestock.detail.production.title')}
          </Text>
          <Text style={styles.healthTopBarSubtitle}>
            {t('farmer.livestock.detail.production.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addHealthButton}
          onPress={() => setIsAddProductionModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.livestock.detail.production.addRecord')}
          testID="animalDetail.production.add"
        >
          <FormPlusIcon size={15} color={P.white} />
          <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Milk Yield Summary Card — today's MILK logs + a 7-day series of real daily totals */}
      {milkWindow.state !== 'ready' ? (
        <SectionState list={milkWindow} testID="animalDetail.production.milk" />
      ) : (
        <View style={styles.whiteCardContainer}>
          <View style={styles.yieldSummaryHeader}>
            <Text style={styles.yieldSummaryLabel}>
              {t('farmer.livestock.detail.production.milkToday')}
            </Text>
            <View style={styles.gradeBadgePill}>
              <Text style={styles.gradeBadgeText}>
                {milkToday.sessions === 1
                  ? t('farmer.livestock.detail.production.sessionOne')
                  : t('farmer.livestock.detail.production.sessions', { count: milkToday.sessions })}
              </Text>
            </View>
          </View>

          <View style={styles.yieldNumberRow} testID="animalDetail.production.todayYield">
            <Text style={styles.yieldBigNumber}>{milkToday.litres}</Text>
            <Text style={styles.yieldUnitText}>{t('farmer.livestock.detail.unit.LITERS')}</Text>
          </View>

          {milkTrend !== null && (
            <>
              <View style={styles.sparklineContainer} testID="animalDetail.production.sparkline">
                <Svg width="100%" height={36} viewBox="0 0 260 36">
                  <Path
                    d={sparklinePath(milkTrend)}
                    fill="none"
                    stroke={colors.brandGreen}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.last7DaysText}>
                {t('farmer.livestock.detail.production.last7Days')}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Withdrawal Warning Alert */}
      {withdrawalActive && animal.withdrawalUntil && (
        <View style={styles.productionAlertCard}>
          <ProhibitedCircleIcon size={17} color={P.twOrange700} />
          <Text style={styles.productionAlertText}>
            {t('farmer.livestock.detail.production.underWithdrawal', {
              date: formatShortDate(animal.withdrawalUntil),
            })}
          </Text>
        </View>
      )}

      {/* Section: PRODUCTION LOG — every product logged for this animal, in its real unit */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.production.log')}</Text>
        <TouchableOpacity
          onPress={() => setIsAddProductionModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.livestock.detail.production.addRecord')}
        >
          <Text style={styles.sectionHeaderAddText}>
            {t('farmer.livestock.detail.common.addInline')}
          </Text>
        </TouchableOpacity>
      </View>
      {productionList.state !== 'ready' ? (
        <SectionState list={productionList} testID="animalDetail.production.logs" />
      ) : productionList.items.length === 0 ? (
        <View style={styles.whiteCardContainer}>
          <Text style={styles.itemSubtitle} testID="animalDetail.production.noLogs">
            {t('farmer.livestock.detail.production.noLogs')}
          </Text>
        </View>
      ) : (
        <View style={styles.whiteCardContainer}>
          {productionList.items.map((log, idx) => {
            const row = productionRow(log);
            return (
              <React.Fragment key={row.id}>
                <View style={styles.itemRow} testID={`animalDetail.production.row:${row.id}`}>
                  <View style={styles.blueIconSquare}>
                    <MilkDropletIcon size={17} color={P.twBlue600} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>{row.title}</Text>
                    {row.subtitle ? <Text style={styles.itemSubtitle}>{row.subtitle}</Text> : null}
                    {row.restricted ? (
                      <Text
                        style={styles.restrictedText}
                        testID={`animalDetail.production.row:${row.id}.restricted`}
                      >
                        {t('farmer.livestock.detail.production.restricted')}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.itemAmountBold}>{row.amount}</Text>
                </View>
                {idx < productionList.items.length - 1 && <View style={styles.dividerLine} />}
              </React.Fragment>
            );
          })}
        </View>
      )}
      <ShowMoreRow list={productionList} testID="animalDetail.production.showMore" />
    </View>
  );
}
