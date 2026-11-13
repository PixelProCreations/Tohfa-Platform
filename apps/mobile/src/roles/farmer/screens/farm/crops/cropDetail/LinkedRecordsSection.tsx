import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../../../../i18n/farmer';
import { authPalette as P, spacing, typography } from '../../../../theme';
import { AnalyticsChartIcon, BeakerIcon, CalendarIcon, ChevronRightIcon, FlagMilestoneIcon, WorkforceUsersIcon } from './icons';
import { sectionStyles } from './sectionStyles';

export interface LinkedRecordsSectionProps {
  achievedMilestonesCount: number;
  milestonesTotal: number;
  milestonesPercent: number;
  diarySummaryText: string;
  inputsSummary: string;
  workforceSummary: string;
  npkSummary: string;
  onNavigateToMilestones?: (() => void) | undefined;
  onNavigateToDiary?: (() => void) | undefined;
  onNavigateToInputs?: (() => void) | undefined;
  onNavigateToWorkforce?: (() => void) | undefined;
  onNavigateToNPK?: (() => void) | undefined;
}

const ICON_SIZE = 18;

interface LinkedRecordCardProps {
  onPress?: (() => void) | undefined;
  accessibilityLabel: string;
  badgeColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  highlight?: boolean;
}

function LinkedRecordCard({
  onPress,
  accessibilityLabel,
  badgeColor,
  icon,
  title,
  subtitle,
  highlight = false,
}: LinkedRecordCardProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={highlight ? [styles.card, styles.npkCard] : styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.iconBadge, { backgroundColor: badgeColor }]}>{icon}</View>

      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={highlight ? styles.npkAlertSubtitle : styles.subtitle}>{subtitle}</Text>
      </View>

      <ChevronRightIcon size={ICON_SIZE} color={highlight ? P.twOrange600 : P.twGray400} />
    </TouchableOpacity>
  );
}

/** "LINKED RECORDS" header plus the five navigation cards. */
export function LinkedRecordsSection({
  achievedMilestonesCount,
  milestonesTotal,
  milestonesPercent,
  diarySummaryText,
  inputsSummary,
  workforceSummary,
  npkSummary,
  onNavigateToMilestones,
  onNavigateToDiary,
  onNavigateToInputs,
  onNavigateToWorkforce,
  onNavigateToNPK,
}: LinkedRecordsSectionProps): React.JSX.Element {
  return (
    <>
      <View style={sectionStyles.sectionHeader}>
        <Text style={sectionStyles.sectionTitle}>{t('farmer.cropDetail.section.linked')}</Text>
      </View>

      <View style={styles.list}>
        <LinkedRecordCard
          onPress={onNavigateToMilestones}
          accessibilityLabel={t('farmer.cropDetail.a11y.viewMilestones')}
          badgeColor={P.twGreen100}
          icon={<FlagMilestoneIcon size={ICON_SIZE} color={P.brandGreen} />}
          title={t('farmer.cropDetail.linked.milestones')}
          subtitle={t('farmer.cropDetail.linked.milestonesProgress', {
            done: achievedMilestonesCount,
            total: milestonesTotal,
            percent: milestonesPercent,
          })}
        />

        <LinkedRecordCard
          onPress={onNavigateToDiary}
          accessibilityLabel={t('farmer.cropDetail.a11y.viewDiary')}
          badgeColor={P.twGreen100}
          icon={<CalendarIcon size={ICON_SIZE} color={P.twGreen700} />}
          title={t('farmer.cropDetail.linked.diary')}
          subtitle={diarySummaryText}
        />

        <LinkedRecordCard
          onPress={onNavigateToInputs}
          accessibilityLabel={t('farmer.cropDetail.a11y.viewInputs')}
          badgeColor={P.twOrange100}
          icon={<BeakerIcon size={ICON_SIZE} color={P.twOrange600} />}
          title={t('farmer.cropDetail.linked.inputs')}
          subtitle={inputsSummary}
        />

        <LinkedRecordCard
          onPress={onNavigateToWorkforce}
          accessibilityLabel={t('farmer.cropDetail.a11y.viewWorkforce')}
          badgeColor={P.twBlue50}
          icon={<WorkforceUsersIcon size={ICON_SIZE} color={P.twBlue600} />}
          title={t('farmer.cropDetail.linked.workforce')}
          subtitle={workforceSummary}
        />

        <LinkedRecordCard
          onPress={onNavigateToNPK}
          accessibilityLabel={t('farmer.cropDetail.a11y.viewNpk')}
          badgeColor={P.twOrange100}
          icon={<AnalyticsChartIcon size={ICON_SIZE} color={P.twOrange600} />}
          title={t('farmer.cropDetail.linked.npk')}
          subtitle={npkSummary}
          highlight
        />
      </View>
    </>
  );
}

const LIST_MARGIN_BOTTOM = 22;
const CARD_PADDING = 14;
const CARD_RADIUS = 14;
const SHADOW_OFFSET_Y = 2;
const SHADOW_OPACITY = 0.03;
const SHADOW_RADIUS = 5;
const CARD_ELEVATION = 2;
const BADGE_SIZE = 38;
const BADGE_RADIUS = 10;
const TEXT_LEFT_GAP = 14;
const SUBTITLE_TOP_GAP = 2;

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    marginBottom: LIST_MARGIN_BOTTOM,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: CARD_PADDING,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: SHADOW_OFFSET_Y },
    shadowOpacity: SHADOW_OPACITY,
    shadowRadius: SHADOW_RADIUS,
    elevation: CARD_ELEVATION,
  },
  npkCard: {
    borderColor: P.twOrange200,
  },
  iconBadge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    marginLeft: TEXT_LEFT_GAP,
  },
  title: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: SUBTITLE_TOP_GAP,
  },
  npkAlertSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twOrange600,
    fontWeight: '600',
    marginTop: SUBTITLE_TOP_GAP,
  },
});

