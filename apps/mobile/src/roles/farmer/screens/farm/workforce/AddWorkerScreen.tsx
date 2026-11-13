import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '@tohfa/mobile-ui';
import { AvatarSection } from './addWorker/AvatarSection';
import { DatePickerModal } from './addWorker/DatePickerModal';
import { GenderPickerModal } from './addWorker/GenderPickerModal';
import { aw } from './addWorker/i18n';
import { styles } from './addWorker/styles';
import { useWorkerForm } from './addWorker/useWorkerForm';
import { WorkerFormFields } from './addWorker/WorkerFormFields';
import { WorkerHeader } from './addWorker/WorkerHeader';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorkerFormData {
  id?: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  idProofName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  salaryType: 'daily' | 'monthly';
  wageAmount: string;
}

export interface AddWorkerScreenProps {
  /**
   * Threaded down like WorkforceScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) when this screen is
   * reached directly -- App.tsx's `navigate('AddWorker')` passes no farmId
   * today, the same situation WorkforceScreen resolves for itself.
   */
  farmId?: string | undefined;
  initialWorker?: Partial<WorkerFormData>;
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: (data: WorkerFormData) => void;
}

export function AddWorkerScreen(props: AddWorkerScreenProps): React.JSX.Element {
  const { onBack, onCancel } = props;
  const { state, dispatch, validation, isEditing, handleSave, handleUploadDoc, handlePickPhoto, handleConfirmDate } =
    useWorkerForm(props);
  const { saving } = state;
  const saveLabel = isEditing ? aw('saveChanges') : aw('titleAdd');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <WorkerHeader isEditing={isEditing} name={state.name} onBack={onBack} onCancel={onCancel} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AvatarSection name={state.name} photoUri={state.photoUri} onPickPhoto={() => void handlePickPhoto()} />
          <WorkerFormFields state={state} dispatch={dispatch} validation={validation} onUploadDoc={() => void handleUploadDoc()} />
        </ScrollView>

        {/* Bottom floating save button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={() => void handleSave()}
            activeOpacity={0.85}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
          >
            <Text style={styles.saveButtonText}>{saving ? aw('saving') : saveLabel}</Text>
          </TouchableOpacity>
        </View>

        <GenderPickerModal
          visible={state.isGenderPickerOpen}
          gender={state.gender}
          onSelect={(gender) => dispatch({ type: 'patch', patch: { gender, isGenderPickerOpen: false } })}
          onClose={() => dispatch({ type: 'patch', patch: { isGenderPickerOpen: false } })}
        />

        <DatePickerModal state={state} dispatch={dispatch} onConfirm={handleConfirmDate} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
