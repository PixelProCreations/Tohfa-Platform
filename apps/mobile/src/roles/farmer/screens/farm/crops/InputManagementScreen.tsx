import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P, radius, spacing, typography } from '../../../theme';
import type { CropItem } from './ProduceCalendarScreen';
import {
  applicationTitle,
  applicationTypeLabel,
  dueLabel,
  formatAppliedDate,
  formatApplicationCost,
  useInputApplications,
  type ApplicationIcon,
  type DueReminder,
} from './inputApplications';

/**
 * FR-F05 Input Management. Recent applications and pest reminders come from
 * the real API through `inputApplications.ts` (crop inputs, BR-56, plus zone
 * pest treatment logs/reminders). There is no fertigation schedule anywhere
 * in the backend, and BR-38 forbids inventing reminders, so the old literal
 * "Fertigation due — Carrot · overdue 1 day" card is replaced by an honest
 * "not available" note rather than faked.
 */

// ─────────────────────────────────────────────
// Vector Icons (Strictly no emojis, theme tokens only)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DropletIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PestIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="2" />
      <Path
        d="M12 6.5V3M6.5 12H3M21 12h-3.5M6.8 6.8L4.5 4.5M19.5 4.5l-2.3 2.3M6.8 17.2l-2.3 2.3M19.5 19.5l-2.3-2.3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ArrowRightIcon({ size = 15, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OrganicSproutIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21V12M12 12C12 7.5 8 4.5 4 4.5c0 5.5 3.5 9.5 8 9.5zM12 12c0-4 3.5-7.5 8-7.5 0 5-3.5 8.5-8 8.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlaskIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 3v4.5L5 18a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3L14 7.5V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8.5" y1="3" x2="15.5" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="15.5" x2="17" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LeafIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 16-9 17Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13c5 0 9 4 9 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SeedlingIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 11v10M12 11a4.5 4.5 0 0 1-4.5-4.5c3.5 0 4.5 2.5 4.5 4.5zM12 14.5a4.5 4.5 0 0 0 4.5-4.5c-3.5 0-4.5 2.5-4.5 4.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 21h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryRotateIcon({ size = 18, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 3v5h5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7v5l3 3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


// ─────────────────────────────────────────────
// Types & Props
// ─────────────────────────────────────────────

/** The zone a pest reminder belongs to, so Log Pest Treatment saves against it. */
export interface PestLogContext {
  farmId: string;
  plotId: string;
}

export interface InputManagementScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToLogInput?: ((crop?: CropItem | null | undefined, inputType?: ('Fertigation' | 'Pest Treatment') | undefined) => void) | undefined;
  onNavigateToLogFertigation?: ((crop?: CropItem | null | undefined) => void) | undefined;
  onNavigateToLogPestTreatment?:
    | ((crop?: CropItem | null | undefined, context?: PestLogContext | undefined) => void)
    | undefined;
  onNavigateToFullHistory?: (() => void) | undefined;
}

export function InputManagementScreen({
  onBack,
  onNavigateToLogInput,
  onNavigateToLogFertigation,
  onNavigateToLogPestTreatment,
  onNavigateToFullHistory,
}: InputManagementScreenProps): React.JSX.Element {
  // Android hardware back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const { state, data, retry, refreshing, refresh } = useInputApplications('recent');

  // No crop is pre-selected: the log screens load the farmer's real crops
  // and let them pick one (a pest reminder carries a zone, never a crop).
  const handleLogFertigation = () => {
    if (onNavigateToLogFertigation) {
      onNavigateToLogFertigation(null);
    } else if (onNavigateToLogInput) {
      onNavigateToLogInput(null, 'Fertigation');
    }
  };

  const handleLogPestMgmt = (context?: PestLogContext) => {
    if (onNavigateToLogPestTreatment) {
      if (context) onNavigateToLogPestTreatment(null, context);
      else onNavigateToLogPestTreatment(null);
    } else if (onNavigateToLogInput) {
      onNavigateToLogInput(null, 'Pest Treatment');
    }
  };

  const renderBadgeIcon = (type: ApplicationIcon) => {
    switch (type) {
      case 'organic':
        return <OrganicSproutIcon size={20} color={P.forestGreen} />;
      case 'pest':
        return <PestIcon size={20} color={P.deepPurple600} />;
      case 'flask':
        return <FlaskIcon size={20} color={P.forestGreen} />;
      case 'leaf':
        return <LeafIcon size={20} color={P.forestGreen} />;
      case 'seedling':
        return <SeedlingIcon size={20} color={P.forestGreen} />;
    }
  };

  const renderReminder = (reminder: DueReminder) => {
    const overdue = reminder.daysUntilDue < 0;
    return (
      <View key={reminder.id} testID={`inputMgmt.reminder.${reminder.id}`} style={styles.reminderCard}>
        <View style={[styles.reminderIconBadge, { backgroundColor: P.twPurple100 }]}>
          <PestIcon size={20} color={P.deepPurple600} />
        </View>

        <View style={styles.reminderInfo}>
          <Text testID={`inputMgmt.reminder.${reminder.id}.title`} style={styles.reminderTitle}>
            {t('farmer.inputManagement.reminder.pestTitle', { title: reminder.title })}
          </Text>
          <Text
            testID={`inputMgmt.reminder.${reminder.id}.zone`}
            style={overdue ? styles.reminderSubtitleOrange : styles.reminderSubtitleGray}
          >
            {`${reminder.zoneName} · `}
            <Text
              testID={`inputMgmt.reminder.${reminder.id}.due`}
              style={overdue ? styles.reminderOverdueText : undefined}
            >
              {dueLabel(reminder.daysUntilDue)}
            </Text>
          </Text>
        </View>

        <TouchableOpacity
          testID={`inputMgmt.reminder.${reminder.id}.logNow`}
          style={[styles.reminderLogBtn, { backgroundColor: P.deepPurple600 }]}
          onPress={() => handleLogPestMgmt({ farmId: reminder.farmId, plotId: reminder.plotId })}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.inputManagement.reminder.logNowFor', { title: reminder.title })}
        >
          <Text style={styles.reminderLogBtnText}>{t('farmer.inputManagement.logNow')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRemindersBody = () => {
    if (state === 'loading' || state === 'error' || data === null) return null;
    return (
      <View style={styles.remindersList}>
        {data.reminders.length === 0 ? (
          <Text testID="inputMgmt.reminders.empty" style={styles.mutedText}>
            {t('farmer.inputManagement.reminders.empty')}
          </Text>
        ) : (
          data.reminders.map(renderReminder)
        )}
        <Text testID="inputMgmt.reminders.fertigationUnavailable" style={styles.mutedText}>
          {t('farmer.inputManagement.reminders.fertigationUnavailable')}
        </Text>
      </View>
    );
  };

  const renderRecentBody = () => {
    if (state === 'loading') {
      return (
        <View testID="inputMgmt.loading" style={styles.stateBox}>
          <ActivityIndicator color={P.forestGreen} />
          <Text style={styles.mutedText}>{t('farmer.common.loading')}</Text>
        </View>
      );
    }
    if (state === 'error' || data === null) {
      return (
        <View testID="inputMgmt.error" style={styles.stateBox}>
          <Text style={styles.errorText}>{t('farmer.inputManagement.loadError')}</Text>
          <TouchableOpacity
            testID="inputMgmt.retry"
            style={styles.retryBtn}
            onPress={retry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.retry')}
          >
            <Text style={styles.retryBtnText}>{t('farmer.common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (data.applications.length === 0) {
      return (
        <View testID="inputMgmt.empty" style={styles.stateBox}>
          <Text style={styles.mutedText}>{t('farmer.inputManagement.recent.empty')}</Text>
        </View>
      );
    }
    return (
      <View style={styles.recentListCard}>
        {data.applications.map((item, index) => {
          const isLast = index === data.applications.length - 1;
          const isPest = item.kind === 'pest';
          return (
            <View
              key={item.key}
              testID={`inputMgmt.app.${item.key}`}
              style={[styles.recentItemRow, !isLast && styles.recentItemBorder]}
            >
              <View
                testID={`inputMgmt.app.${item.key}.icon.${item.icon}`}
                style={[
                  styles.recentIconBadge,
                  { backgroundColor: isPest ? P.twPurple100 : P.mintTintBg },
                ]}
              >
                {renderBadgeIcon(item.icon)}
              </View>

              <View style={styles.recentInfoCol}>
                <Text testID={`inputMgmt.app.${item.key}.title`} style={styles.recentItemTitle}>
                  {applicationTitle(item)}
                </Text>
                <Text testID={`inputMgmt.app.${item.key}.subtitle`} style={styles.recentItemSubtitle}>
                  {`${formatAppliedDate(item.appliedOn)} · ${applicationTypeLabel(item.kind)}`}
                </Text>
              </View>

              <Text testID={`inputMgmt.app.${item.key}.cost`} style={styles.recentItemCost}>
                {formatApplicationCost(item.cost)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ArrowBackIcon size={20} color={P.deepGreen} />
        </TouchableOpacity>

        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTag}>{t('farmer.inputManagement.code')}</Text>
          <Text style={styles.headerTitle}>{t('farmer.inputManagement.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.inputManagement.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={P.forestGreen} />
        }
      >
        {/* 2-Column Action Cards */}
        <View style={styles.topCardsRow}>
          {/* Card 1: Fertigation */}
          <TouchableOpacity
            testID="inputMgmt.logFertigation"
            style={[styles.topCard, { backgroundColor: P.forestGreen }]}
            onPress={handleLogFertigation}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${t('farmer.inputManagement.card.fertigation.title')}, ${t('farmer.inputManagement.card.fertigation.body')}`}
          >
            <View style={styles.cardIconCircle}>
              <DropletIcon size={20} color={P.white} />
            </View>
            <Text style={styles.cardTitle}>{t('farmer.inputManagement.card.fertigation.title')}</Text>
            <Text style={styles.cardSubtitle}>{t('farmer.inputManagement.card.fertigation.body')}</Text>
            <View style={styles.cardActionRow}>
              <Text style={styles.cardActionText}>{t('farmer.inputManagement.logNow')}</Text>
              <ArrowRightIcon size={15} color={P.white} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Pest Mgmt */}
          <TouchableOpacity
            testID="inputMgmt.logPest"
            style={[styles.topCard, { backgroundColor: P.deepPurple600 }]}
            onPress={() => handleLogPestMgmt()}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${t('farmer.inputManagement.card.pest.title')}, ${t('farmer.inputManagement.card.pest.body')}`}
          >
            <View style={styles.cardIconCircle}>
              <PestIcon size={20} color={P.white} />
            </View>
            <Text style={styles.cardTitle}>{t('farmer.inputManagement.card.pest.title')}</Text>
            <Text style={styles.cardSubtitle}>{t('farmer.inputManagement.card.pest.body')}</Text>
            <View style={styles.cardActionRow}>
              <Text style={styles.cardActionText}>{t('farmer.inputManagement.logNow')}</Text>
              <ArrowRightIcon size={15} color={P.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: UPCOMING REMINDERS */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>{t('farmer.inputManagement.reminders.title')}</Text>
        </View>
        {renderRemindersBody()}

        {/* Section: RECENT APPLICATIONS */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionTitle}>{t('farmer.inputManagement.recent.title')}</Text>
          <TouchableOpacity
            testID="inputMgmt.fullHistoryLink"
            onPress={onNavigateToFullHistory}
            activeOpacity={0.7}
            hitSlop={{ top: spacing.sm, bottom: spacing.sm, left: spacing.sm, right: spacing.sm }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.inputManagement.recent.fullHistory')}
          >
            <Text style={styles.fullHistoryLink}>{t('farmer.inputManagement.recent.fullHistory')}</Text>
          </TouchableOpacity>
        </View>

        {renderRecentBody()}

        {/* Bottom Button: View full history */}
        <TouchableOpacity
          testID="inputMgmt.viewFullHistory"
          style={styles.viewFullHistoryBtn}
          onPress={onNavigateToFullHistory}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.inputManagement.recent.viewFullHistory')}
        >
          <HistoryRotateIcon size={18} color={P.forestGreen} />
          <Text style={styles.viewFullHistoryBtnText}>{t('farmer.inputManagement.recent.viewFullHistory')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.input,
    paddingTop: Platform.OS === 'android' ? spacing.sm : spacing.xs,
    paddingBottom: spacing.md,
    backgroundColor: P.white,
  },
  backButton: {
    width: spacing.largeSection,
    height: spacing.largeSection,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTag: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  scrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingBottom: spacing.largeSection,
  },
  topCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.input,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  topCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    justifyContent: 'space-between',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconCircle: {
    width: spacing.largeSection,
    height: spacing.largeSection,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.white,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: spacing.xs,
    flex: 1,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  cardActionText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
  sectionHeaderWrap: {
    paddingHorizontal: spacing.input,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  remindersList: {
    paddingHorizontal: spacing.input,
    gap: spacing.md,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  reminderIconBadge: {
    width: spacing.largeSection,
    height: spacing.largeSection,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reminderInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  reminderTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.1,
  },
  reminderSubtitleOrange: {
    fontSize: typography.bodySmall,
    color: P.twOrange700,
    marginTop: spacing.xs,
  },
  reminderOverdueText: {
    fontWeight: '700',
    color: P.twOrange700,
  },
  reminderSubtitleGray: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: spacing.xs,
  },
  reminderLogBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderLogBtnText: {
    color: P.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  mutedText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  errorText: {
    fontSize: typography.body,
    color: P.twOrange700,
    textAlign: 'center',
  },
  stateBox: {
    marginHorizontal: spacing.input,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: P.forestGreen,
  },
  retryBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.forestGreen,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.input,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  fullHistoryLink: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.forestGreen,
  },
  recentListCard: {
    backgroundColor: P.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginHorizontal: spacing.input,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  recentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  recentIconBadge: {
    width: spacing.largeSection,
    height: spacing.largeSection,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recentInfoCol: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.1,
  },
  recentItemSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: spacing.xs,
  },
  recentItemCost: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    marginLeft: spacing.md,
  },
  viewFullHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.input,
    marginTop: spacing.lg,
    minHeight: spacing.xxxl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    gap: spacing.sm,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  viewFullHistoryBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.forestGreen,
  },
});
