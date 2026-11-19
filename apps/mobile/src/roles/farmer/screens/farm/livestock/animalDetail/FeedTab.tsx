import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { feedLogAmount, feedReferenceView, feedTypeLabel } from '../animalRecordView';
import { type useAnimalFeedLogs, type useAnimalFeedPlan } from '../useAnimalRecords';
import { styles } from './styles';
import {
  SproutFodderIcon,
  ConcentrateMeshIcon,
  FormPlusIcon,
} from '../../../../assets/icons/AssetIcons';
import { ShowMoreRow, SectionState, formatShortDate } from './shared';
import { type FeedPlanForm } from './FeedPlanModal';

export interface FeedTabProps {
  feedPlanList: ReturnType<typeof useAnimalFeedPlan>;
  feedLogList: ReturnType<typeof useAnimalFeedLogs>;
  setIsAddFeedModalVisible: FeedPlanForm['setIsAddFeedModalVisible'];
  openFeedLogModal: () => void;
}

/** Feed tab: the current feed reference (newest plan) and the daily feed log. */
export function FeedTab({
  feedPlanList,
  feedLogList,
  setIsAddFeedModalVisible,
  openFeedLogModal,
}: FeedTabProps): React.JSX.Element {
  const currentFeedPlan = feedPlanList.items[0];
  const feedReference = currentFeedPlan ? feedReferenceView(currentFeedPlan) : null;

  return (
    <View style={styles.tabContentContainer}>
      {/* Top Bar with Add Button */}
      <View style={styles.healthTopBar}>
        <View style={styles.healthTopBarTitleCol}>
          <Text style={styles.healthTopBarTitle}>{t('farmer.livestock.detail.feed.title')}</Text>
          <Text style={styles.healthTopBarSubtitle}>
            {t('farmer.livestock.detail.feed.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addHealthButton}
          onPress={() => setIsAddFeedModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.livestock.detail.feed.addReference')}
          testID="animalDetail.feed.add"
        >
          <FormPlusIcon size={15} color={P.white} />
          <Text style={styles.addHealthButtonText}>{t('farmer.livestock.detail.common.add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Section: FEED REFERENCE — the newest feed plan is the current one */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.feed.reference')}</Text>
        <TouchableOpacity
          onPress={() => setIsAddFeedModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.livestock.detail.feed.addReference')}
        >
          <Text style={styles.sectionHeaderAddText}>
            {t('farmer.livestock.detail.common.addInline')}
          </Text>
        </TouchableOpacity>
      </View>
      {feedPlanList.state !== 'ready' ? (
        <SectionState list={feedPlanList} testID="animalDetail.feed.plan" />
      ) : feedReference === null ? (
        <View style={styles.whiteCardContainer}>
          <Text style={styles.itemSubtitle} testID="animalDetail.feed.noPlan">
            {t('farmer.livestock.detail.feed.noPlan')}
          </Text>
        </View>
      ) : (
        <View style={styles.whiteCardContainer} testID="animalDetail.feed.reference">
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.feedType')}</Text>
            <Text style={styles.tableValueBold}>{feedReference.feedType}</Text>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.source')}</Text>
            <Text style={styles.tableValueBold}>
              {feedReference.source ?? t('farmer.livestock.detail.feed.notRecorded')}
            </Text>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.grazing')}</Text>
            <Text style={styles.tableValueBold}>
              {feedReference.grazing ?? t('farmer.livestock.detail.feed.notRecorded')}
            </Text>
          </View>
          <View style={styles.dividerLine} />
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.waterSource')}</Text>
            <View style={styles.waterSourceValRow}>
              <Text style={styles.tableValueBold}>{feedReference.waterSource}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Section: DAILY FEED LOG — its own "+ Add" opens the feed-LOG modal (never the feed-plan one) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.feed.dailyLog')}</Text>
        <TouchableOpacity
          onPress={openFeedLogModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.livestock.detail.feed.addLog')}
          testID="animalDetail.feed.addLog"
        >
          <Text style={styles.sectionHeaderAddText}>
            {t('farmer.livestock.detail.common.addInline')}
          </Text>
        </TouchableOpacity>
      </View>
      {feedLogList.state !== 'ready' ? (
        <SectionState list={feedLogList} testID="animalDetail.feed.logs" />
      ) : (
        <View style={styles.whiteCardContainer}>
          {feedLogList.items.length === 0 ? (
            <Text style={styles.itemSubtitle} testID="animalDetail.feed.noLogs">
              {t('farmer.livestock.detail.feed.noLogs')}
            </Text>
          ) : (
            feedLogList.items.map((log, idx) => (
              <React.Fragment key={log.id}>
                {idx > 0 && <View style={styles.dividerLine} />}
                <View style={styles.itemRow} testID={`animalDetail.feed.log:${log.id}`}>
                  <View style={styles.tanIconSquare}>
                    {log.feedType === 'CONCENTRATE_MIX' ? (
                      <ConcentrateMeshIcon size={18} color={P.twAmber800} />
                    ) : (
                      <SproutFodderIcon size={18} color={P.twAmber800} />
                    )}
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>{feedTypeLabel(log.feedType)}</Text>
                    <Text style={styles.itemSubtitle}>{formatShortDate(log.fedOn)}</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>{feedLogAmount(log.quantity, log.unit)}</Text>
                </View>
              </React.Fragment>
            ))
          )}
        </View>
      )}
      <ShowMoreRow list={feedLogList} testID="animalDetail.feed.showMore" />
    </View>
  );
}
