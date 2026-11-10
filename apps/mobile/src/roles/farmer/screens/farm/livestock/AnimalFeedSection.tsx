/**
 * Feed tab of AnimalDetailScreen: Dev's design (FEED REFERENCE table with the
 * water-source link icon and footnote, DAILY FEED LOG rows) filled from the
 * newest feed plan (GET .../feed-plans?limit=1, "the newest is current") and
 * GET .../feed-logs instead of sample rows.
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { authPalette as P } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { ConcentrateMeshIcon, LinkChainIcon, SproutFodderIcon } from './animalDetailIcons';
import { AddRecordButton, SectionState, ShowMoreRow, type SectionProps } from './animalDetailSectionParts';
import { AnimalRecordFormModal } from './AnimalRecordFormModal';
import { feedLogAmount, feedReferenceView, feedTypeLabel, formatDayMonth } from './animalRecordView';
import { useAnimalFeedLogs, useAnimalFeedPlan } from './useAnimalRecords';

export interface AnimalFeedSectionProps extends SectionProps {
  animalId: string;
}

export function AnimalFeedSection({ animalId, styles }: AnimalFeedSectionProps): React.JSX.Element {
  const feedPlanList = useAnimalFeedPlan(animalId, true);
  const feedLogList = useAnimalFeedLogs(animalId, true);
  const currentPlan = feedPlanList.items[0];
  const reference = currentPlan ? feedReferenceView(currentPlan) : null;
  const [adding, setAdding] = useState<'feedPlan' | 'feedLog' | null>(null);

  return (
    <View style={styles.tabContentContainer}>
      {adding !== null ? (
        <AnimalRecordFormModal
          kind={adding}
          animalId={animalId}
          onClose={() => setAdding(null)}
          onSaved={() => {
            // The newest plan is the current one, so a new plan replaces the reference card.
            (adding === 'feedPlan' ? feedPlanList : feedLogList).refresh();
            setAdding(null);
          }}
        />
      ) : null}

      {/* Section: FEED REFERENCE */}
      <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.feed.reference')}</Text>
      <AddRecordButton
        label={t('farmer.livestock.detail.form.addFeedPlan')}
        onPress={() => setAdding('feedPlan')}
        testID="animalDetail.feed.addPlan"
        styles={styles}
      />
      {feedPlanList.state !== 'ready' ? (
        <SectionState list={feedPlanList} testID="animalDetail.feed.plan" styles={styles} />
      ) : reference === null ? (
        <View style={styles.whiteCardContainer}>
          <Text style={styles.itemSubtitle} testID="animalDetail.feed.noPlan">
            {t('farmer.livestock.detail.feed.noPlan')}
          </Text>
        </View>
      ) : (
        <View style={styles.whiteCardContainer} testID="animalDetail.feed.reference">
          {/* Feed type */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.feedType')}</Text>
            <Text style={styles.tableValueBold}>{reference.feedType}</Text>
          </View>
          <View style={styles.dividerLine} />

          {/* Source */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.source')}</Text>
            <Text style={styles.tableValueBold}>{reference.source ?? t('farmer.livestock.detail.feed.notRecorded')}</Text>
          </View>
          <View style={styles.dividerLine} />

          {/* Grazing */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.grazing')}</Text>
            <Text style={styles.tableValueBold}>{reference.grazing ?? t('farmer.livestock.detail.feed.notRecorded')}</Text>
          </View>
          <View style={styles.dividerLine} />

          {/* Water source */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('farmer.livestock.detail.feed.waterSource')}</Text>
            <View style={styles.waterSourceValRow}>
              <Text style={styles.tableValueBold}>{reference.waterSource}</Text>
              <LinkChainIcon size={14} color={P.twBlue600} />
            </View>
          </View>
        </View>
      )}

      {/* Water source helper caption */}
      <Text style={styles.footnoteCaption} testID="animalDetail.feed.waterSourceCaption">
        {t('farmer.livestock.detail.feed.waterSourceCaption')}
      </Text>

      {/* Section: DAILY FEED LOG */}
      <Text style={styles.sectionHeaderTitle}>{t('farmer.livestock.detail.feed.dailyLog')}</Text>
      <AddRecordButton
        label={t('farmer.livestock.detail.form.addFeedLog')}
        onPress={() => setAdding('feedLog')}
        testID="animalDetail.feed.addLog"
        styles={styles}
      />
      {feedLogList.state !== 'ready' ? (
        <SectionState list={feedLogList} testID="animalDetail.feed.logs" styles={styles} />
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
                    <Text style={styles.itemSubtitle}>{formatDayMonth(log.fedOn)}</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>{feedLogAmount(log.quantity, log.unit)}</Text>
                </View>
              </React.Fragment>
            ))
          )}
        </View>
      )}
      <ShowMoreRow list={feedLogList} testID="animalDetail.feed.showMore" styles={styles} />
    </View>
  );
}
