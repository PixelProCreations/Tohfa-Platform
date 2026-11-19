import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors } from '../../../../theme';
import type { PestTreatmentReminder } from '../../../../api/pest';
import { CalendarScheduleIcon } from '../pestManagement/icons';
import { CheckCircleIcon, CircleOutlineIcon } from './icons';
import { REMINDER_TABS, type ReminderTab } from './constants';
import { formatIsoDisplay } from './dateUtils';
import { ts } from './i18n';
import { styles } from './styles';

const REPEAT_KNOWN = ['ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];

function repeatDisplay(value: string): string {
  return REPEAT_KNOWN.includes(value) ? ts(`farmer.treatmentSchedule.repeatDisplay.${value}`) : value;
}

interface ReminderTabsProps {
  activeTab: ReminderTab;
  onChange: (tab: ReminderTab) => void;
}

export function ReminderTabs({ activeTab, onChange }: ReminderTabsProps): React.JSX.Element {
  return (
    <View style={styles.tabRow}>
      {REMINDER_TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabPill, isActive && styles.tabPillActive]}
            onPress={() => onChange(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
              {ts(`farmer.treatmentSchedule.tab.${tab}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface ReminderListProps {
  loading: boolean;
  error: string | null;
  items: PestTreatmentReminder[];
  activeTab: ReminderTab;
  onToggle: (reminder: PestTreatmentReminder) => void;
}

export function ReminderList({ loading, error, items, activeTab, onToggle }: ReminderListProps): React.JSX.Element {
  if (loading) {
    return (
      <View style={styles.skeletonStack}>
        <Skeleton height={80} width="100%" />
        <Skeleton height={80} width="100%" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.loadErrorText}>{error}</Text>
      </View>
    );
  }
  return (
    <View style={styles.remindersList}>
      {items.length > 0 ? (
        items.map((item) => {
          const isCompleted = item.status === 'Completed';
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.reminderCard}
              activeOpacity={0.85}
              onPress={() => onToggle(item)}
            >
              <View style={[styles.iconBox, isCompleted ? styles.iconBoxCompleted : styles.iconBoxUpcoming]}>
                {isCompleted ? (
                  <CheckCircleIcon size={22} color={colors.brandGreen} />
                ) : (
                  <CalendarScheduleIcon size={22} color={P.deepGreen} />
                )}
              </View>

              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>{item.title}</Text>
                <Text style={styles.reminderSub}>
                  {isCompleted
                    ? ts('farmer.treatmentSchedule.card.completedOn', {
                        date: formatIsoDisplay(item.completedAt ?? item.dueDate),
                      })
                    : ts('farmer.treatmentSchedule.card.due', {
                        date: formatIsoDisplay(item.dueDate),
                        repeat: repeatDisplay(item.repeatInterval),
                      })}
                </Text>
              </View>

              {/* Explicit tap target for the status toggle -- the whole card is
                  also tappable (kept for convenience), but this is the visible,
                  labeled affordance so it is clear what tapping actually does. */}
              <View style={styles.completeToggleCol}>
                {isCompleted ? (
                  <CheckCircleIcon size={26} color={colors.brandGreen} />
                ) : (
                  <CircleOutlineIcon size={26} color={P.twGray400} />
                )}
                <Text style={styles.completeToggleLabel}>
                  {isCompleted
                    ? ts('farmer.treatmentSchedule.card.tapReopen')
                    : ts('farmer.treatmentSchedule.card.tapComplete')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{ts(`farmer.treatmentSchedule.empty.${activeTab}`)}</Text>
        </View>
      )}
    </View>
  );
}
