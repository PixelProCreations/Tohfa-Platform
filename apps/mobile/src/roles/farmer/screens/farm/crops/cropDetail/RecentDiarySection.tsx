import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../../../../i18n/farmer';
import { authPalette as P, radius, spacing, typography } from '../../../../theme';
import type { DiaryEntrySummary } from '../../../../api/farmDiary';
import { CompostIcon, SproutDiaryIcon } from './icons';
import { formatActivityTitle, formatDiaryTimestamp, formatMinutesDuration } from './format';
import { sectionStyles } from './sectionStyles';

export interface RecentDiarySectionProps {
  /** True once a real farm_crops row has loaded; otherwise the preset sample rows show. */
  hasFarmCrop: boolean;
  recentDiaryEntries: DiaryEntrySummary[];
  onNavigateToDiary?: (() => void) | undefined;
}

const ICON_SIZE = 16;

interface DiaryRowProps {
  accessibilityLabel: string;
  icon: React.ReactNode;
  title: string;
  time: string;
  duration: string;
  onPress?: (() => void) | undefined;
}

function DiaryRow({ accessibilityLabel, icon, title, time, duration, onPress }: DiaryRowProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.iconBadge}>{icon}</View>

      <View style={styles.textCol}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>

      <Text style={styles.durationText}>{duration}</Text>
    </TouchableOpacity>
  );
}

/** "RECENT DIARY ENTRIES" header plus the (real or preset sample) entry list. */
export function RecentDiarySection({
  hasFarmCrop,
  recentDiaryEntries,
  onNavigateToDiary,
}: RecentDiarySectionProps): React.JSX.Element {
  const weeding = t('farmer.cropDetail.sampleDiary.weeding');
  const manure = t('farmer.cropDetail.sampleDiary.manure');

  return (
    <>
      <View style={styles.header}>
        <Text style={sectionStyles.sectionTitle}>{t('farmer.cropDetail.section.recentDiary')}</Text>
        <TouchableOpacity onPress={onNavigateToDiary} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>{t('farmer.cropDetail.viewAll')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {hasFarmCrop ? (
          recentDiaryEntries.length > 0 ? (
            recentDiaryEntries.map((entry) => (
              <DiaryRow
                key={entry.id}
                onPress={onNavigateToDiary}
                accessibilityLabel={t('farmer.cropDetail.a11y.diaryEntry', { name: entry.subActivityKey })}
                icon={<SproutDiaryIcon size={ICON_SIZE} color={P.twGreen700} />}
                title={formatActivityTitle(entry.subActivityKey)}
                time={formatDiaryTimestamp(entry.loggedAt)}
                duration={formatMinutesDuration(entry.minutes)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{t('farmer.crops.detail.diaryNone')}</Text>
          )
        ) : (
          <>
            <DiaryRow
              onPress={onNavigateToDiary}
              accessibilityLabel={t('farmer.cropDetail.a11y.diaryEntry', { name: weeding })}
              icon={<SproutDiaryIcon size={ICON_SIZE} color={P.twGreen700} />}
              title={weeding}
              time="15 Jul · 06:45 AM"
              duration="50m"
            />
            <DiaryRow
              onPress={onNavigateToDiary}
              accessibilityLabel={t('farmer.cropDetail.a11y.diaryEntry', { name: manure })}
              icon={<CompostIcon size={ICON_SIZE} color={P.twGreen700} />}
              title={manure}
              time="15 Jul · 11:00 AM"
              duration="1h 15m"
            />
          </>
        )}
      </View>
    </>
  );
}

const HEADER_BOTTOM_GAP = 10;
const HEADER_TOP_GAP = 4;
const SHADOW_OFFSET_Y = 2;
const SHADOW_OPACITY = 0.03;
const SHADOW_RADIUS = 6;
const CARD_ELEVATION = 2;
const ITEM_PADDING = 14;
const BADGE_SIZE = 36;
const BADGE_RADIUS = 10;
const TEXT_LEFT_GAP = 12;
const TIME_TOP_GAP = 2;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: HEADER_BOTTOM_GAP,
    marginTop: HEADER_TOP_GAP,
  },
  viewAllText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGreen700,
  },
  list: {
    backgroundColor: P.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: P.twGray200,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: SHADOW_OFFSET_Y },
    shadowOpacity: SHADOW_OPACITY,
    shadowRadius: SHADOW_RADIUS,
    elevation: CARD_ELEVATION,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ITEM_PADDING,
    paddingVertical: ITEM_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  iconBadge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGreen100,
  },
  textCol: {
    flex: 1,
    marginLeft: TEXT_LEFT_GAP,
  },
  activityTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  activityTime: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: TIME_TOP_GAP,
  },
  durationText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGreen700,
  },
  emptyText: {
    fontSize: typography.body,
    color: P.twGray500,
    paddingVertical: spacing.md,
  },
});
