import React, { useEffect, useMemo } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModalSafeArea } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../../theme';
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  InfoCircleIcon,
} from '../pestManagement/icons';
import { CalendarOverlay } from './CalendarOverlay';
import { DetectionPickerOverlay, RepeatPickerOverlay } from './PickerOverlays';
import { ts } from './i18n';
import type { ScheduleAction, ScheduleState } from './scheduleReducer';
import { styles } from './styles';
import { useFieldValidation } from '../../../../utils/validation';
import { FieldErrorText } from '../../FieldErrorText';
import { REMINDER_FIELD_ORDER, REMINDER_RULES } from './reminderValidation';

interface AddReminderModalProps {
  state: ScheduleState;
  patch: (p: Partial<ScheduleState>) => void;
  dispatch: (a: ScheduleAction) => void;
  linkedDetectionLabel: string;
  onSave: () => void;
  onApplyDate: () => void;
}

export function AddReminderModal({
  state,
  patch,
  dispatch,
  linkedDetectionLabel,
  onSave,
  onApplyDate,
}: AddReminderModalProps): React.JSX.Element {
  const { saving } = state;
  const fieldValues = useMemo(
    () => ({ treatmentName: state.treatmentName, notes: state.notes }),
    [state.treatmentName, state.notes],
  );
  const validation = useFieldValidation({ values: fieldValues, rules: REMINDER_RULES, order: REMINDER_FIELD_ORDER });
  const { reset: resetValidation } = validation;
  useEffect(() => {
    if (!state.isAddModalOpen) resetValidation();
  }, [state.isAddModalOpen, resetValidation]);
  const closeModal = () => patch({ isAddModalOpen: false });

  return (
    <Modal
      visible={state.isAddModalOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={closeModal}
    >
      <ModalSafeArea style={styles.modalSafeArea}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
            <CloseIcon size={20} color={P.twGray700} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{ts('farmer.treatmentSchedule.modal.title')}</Text>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{ts('farmer.treatmentSchedule.field.linkedDetection')}</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              activeOpacity={0.8}
              onPress={() => patch({ isDetectionPickerOpen: true })}
            >
              <Text style={styles.dropdownValue}>{linkedDetectionLabel}</Text>
              <ChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
            <View style={styles.helperRow}>
              <InfoCircleIcon size={14} color={P.twGray400} />
              <Text style={styles.helperText}>{ts('farmer.treatmentSchedule.field.linkedDetectionHelp')}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {ts('farmer.treatmentSchedule.field.treatmentName')} <Text style={styles.asterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={state.treatmentName}
              onChangeText={(v) => patch({ treatmentName: v })}
              onBlur={() => validation.onBlur('treatmentName')}
              maxLength={160}
              placeholder={ts('farmer.treatmentSchedule.field.treatmentNamePlaceholder')}
              placeholderTextColor={P.twGray400}
            />
            <FieldErrorText message={validation.messageFor('treatmentName')} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              {ts('farmer.treatmentSchedule.field.scheduledDate')} <Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              activeOpacity={0.8}
              onPress={() => patch({ isCalendarOpen: true })}
            >
              <Text style={styles.dropdownValue}>{state.scheduledDate}</Text>
              <CalendarIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{ts('farmer.treatmentSchedule.field.repeat')}</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              activeOpacity={0.8}
              onPress={() => patch({ isRepeatPickerOpen: true })}
            >
              <Text style={styles.dropdownValue}>{ts(`farmer.treatmentSchedule.repeat.${state.repeatOption}`)}</Text>
              <ChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{ts('farmer.pestManagement.report.notes')}</Text>
            <TextInput
              style={styles.notesInput}
              value={state.notes}
              onChangeText={(v) => patch({ notes: v })}
              onBlur={() => validation.onBlur('notes')}
              maxLength={2000}
              placeholder={ts('farmer.pestManagement.report.notesPlaceholder')}
              placeholderTextColor={P.twGray400}
              multiline
              numberOfLines={3}
            />
            <FieldErrorText message={validation.messageFor('notes')} />
          </View>

          {state.saveError ? <Text style={styles.saveErrorText}>{state.saveError}</Text> : null}
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.modalCancelBtn} onPress={closeModal} disabled={saving}>
            <Text style={styles.modalCancelText}>{ts('farmer.pestManagement.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalSaveBtn, saving && styles.modalSaveBtnSaving]}
            activeOpacity={0.85}
            onPress={() => {
              if (validation.validateAll().valid) onSave();
            }}
            disabled={saving}
          >
            <CheckIcon size={18} color={P.white} />
            <Text style={styles.modalSaveText}>
              {saving ? ts('farmer.treatmentSchedule.modal.saving') : ts('farmer.treatmentSchedule.modal.save')}
            </Text>
          </TouchableOpacity>
        </View>

        {state.isDetectionPickerOpen && (
          <DetectionPickerOverlay
            detections={state.detections}
            selectedId={state.linkedDetectionId}
            onSelect={(id) => patch({ linkedDetectionId: id, isDetectionPickerOpen: false })}
            onClose={() => patch({ isDetectionPickerOpen: false })}
          />
        )}

        {state.isRepeatPickerOpen && (
          <RepeatPickerOverlay
            selected={state.repeatOption}
            onSelect={(value) => patch({ repeatOption: value, isRepeatPickerOpen: false })}
            onClose={() => patch({ isRepeatPickerOpen: false })}
          />
        )}

        {state.isCalendarOpen && (
          <CalendarOverlay state={state} patch={patch} dispatch={dispatch} onApply={onApplyDate} />
        )}
      </ModalSafeArea>
    </Modal>
  );
}
