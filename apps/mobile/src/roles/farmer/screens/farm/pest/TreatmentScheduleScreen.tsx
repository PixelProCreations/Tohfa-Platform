import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../theme';
import { ArrowBackIcon } from './pestManagement/icons';
import { AddReminderModal } from './treatmentSchedule/AddReminderModal';
import { ts } from './treatmentSchedule/i18n';
import { ReminderList, ReminderTabs } from './treatmentSchedule/ReminderList';
import { styles } from './treatmentSchedule/styles';
import { useTreatmentSchedule } from './treatmentSchedule/useTreatmentSchedule';

export interface TreatmentScheduleScreenProps {
  /**
   * Threaded down from PestManagementScreen when reached via the hub; resolved
   * locally (first farm + first zone) when this screen is opened directly, the
   * same "no plot picker in this mock's UI" fallback UploadNewSoilTestScreen.tsx
   * uses -- there is no zone selector drawn anywhere in this screen either.
   */
  farmId?: string | undefined;
  plotId?: string | undefined;
  onBack?: () => void;
}

export function TreatmentScheduleScreen({
  farmId,
  plotId,
  onBack,
}: TreatmentScheduleScreenProps): React.JSX.Element {
  const { state, patch, dispatch, linkedDetectionLabel, handleSaveReminder, handleToggleReminderStatus, handleApplyDate } =
    useTreatmentSchedule(farmId, plotId);

  const filteredReminders = state.reminders.filter((r) => r.status === state.activeTab);
  const upcomingCount = state.reminders.filter((r) => r.status === 'Upcoming').length;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={ts('farmer.pestManagement.back')}
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>{ts('farmer.pestManagement.hub.scheduleTitle')}</Text>
            <Text style={styles.headerSubtitle}>
              {ts('farmer.treatmentSchedule.header.upcomingCount', { count: upcomingCount })}
            </Text>
          </View>
        </View>

        {state.contextLoading ? (
          <Skeleton height={140} width="100%" />
        ) : state.contextError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.loadErrorText}>{state.contextError}</Text>
          </View>
        ) : (
          <>
            <ReminderTabs activeTab={state.activeTab} onChange={(tab) => patch({ activeTab: tab })} />
            <ReminderList
              loading={state.remindersLoading}
              error={state.remindersError}
              items={filteredReminders}
              activeTab={state.activeTab}
              onToggle={(r) => void handleToggleReminderStatus(r)}
            />
          </>
        )}
      </ScrollView>

      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.floatingBtn}
          activeOpacity={0.85}
          onPress={() => patch({ isAddModalOpen: true })}
          accessibilityRole="button"
          accessibilityLabel={ts('farmer.treatmentSchedule.fab.add')}
          disabled={state.contextLoading || !!state.contextError}
        >
          <Text style={styles.floatingBtnPlus}>+</Text>
          <Text style={styles.floatingBtnText}>{ts('farmer.treatmentSchedule.fab.add')}</Text>
        </TouchableOpacity>
      </View>

      <AddReminderModal
        state={state}
        patch={patch}
        dispatch={dispatch}
        linkedDetectionLabel={linkedDetectionLabel}
        onSave={() => void handleSaveReminder()}
        onApplyDate={handleApplyDate}
      />
    </SafeAreaView>
  );
}
