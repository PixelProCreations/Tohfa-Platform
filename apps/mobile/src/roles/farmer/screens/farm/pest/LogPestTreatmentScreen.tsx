import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text } from 'react-native';
import type { PestTreatmentLog } from '../../../api/pest';
import type { CropItem } from '../crops/cropItems';
import { LogPestHeader } from './logPestTreatment/LogPestHeader';
import {
  CropField,
  PestField,
  PestInfoCard,
  PhotoField,
  TypeSeverityRow,
} from './logPestTreatment/PestIdentificationFields';
import { PickerModals } from './logPestTreatment/PickerModals';
import { IntervalPhiRow, NextDateField, SaveButton, TreatmentField } from './logPestTreatment/TreatmentFields';
import { styles } from './logPestTreatment/styles';
import { useLogPestTreatmentForm } from './logPestTreatment/useLogPestTreatmentForm';

export interface LogPestTreatmentScreenProps {
  crop?: CropItem | null | undefined;
  /**
   * Threaded down when the caller already knows it (nothing in App.tsx does
   * today -- InputManagementScreen has no farm/zone context of its own), else
   * resolved locally (first farm + first zone), the same fallback
   * PestManagementScreen and TreatmentScheduleScreen use.
   */
  farmId?: string | undefined;
  plotId?: string | undefined;
  onBack?: (() => void) | undefined;
  onSave?: ((data?: PestTreatmentLog) => void) | undefined;
}

export function LogPestTreatmentScreen({
  crop,
  farmId,
  plotId,
  onBack,
  onSave,
}: LogPestTreatmentScreenProps): React.JSX.Element {
  const { state, dispatch, validation, cropOptions, handlePickPhoto, handleSave, nextDateDisplay } = useLogPestTreatmentForm({
    crop,
    farmId,
    plotId,
    onBack,
    onSave,
  });
  const saveDisabled = state.saving || state.contextLoading || !!state.contextError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <LogPestHeader onBack={onBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CropField selectedCrop={state.selectedCrop} onOpen={() => dispatch({ type: 'open', modal: 'crop' })} />

        <PestField
          selectedCrop={state.selectedCrop}
          selectedPest={state.selectedPest}
          loading={state.pestOptionsLoading}
          error={state.pestOptionsError}
          onOpen={() => dispatch({ type: 'open', modal: 'pest' })}
        />

        {state.selectedPest ? <PestInfoCard pest={state.selectedPest} /> : null}

        <TypeSeverityRow
          category={state.category}
          severity={state.severity}
          onOpenType={() => dispatch({ type: 'open', modal: 'type' })}
          onOpenSeverity={() => dispatch({ type: 'open', modal: 'severity' })}
        />

        <PhotoField
          photo={state.photo}
          onPick={() => void handlePickPhoto()}
          onRemove={() => dispatch({ type: 'setPhoto', photo: null })}
        />

        <TreatmentField treatment={state.treatment} onOpen={() => dispatch({ type: 'open', modal: 'treatment' })} />

        <IntervalPhiRow
          intervalDays={state.intervalDays}
          phiDays={state.phiDays}
          onChangeInterval={(value) => dispatch({ type: 'setIntervalDays', value })}
          onChangePhi={(value) => dispatch({ type: 'setPhiDays', value })}
          onBlurInterval={() => validation.onBlur('intervalDays')}
          onBlurPhi={() => validation.onBlur('phiDays')}
          intervalError={validation.messageFor('intervalDays')}
          phiError={validation.messageFor('phiDays')}
        />

        <NextDateField display={nextDateDisplay} intervalDays={state.intervalDays} />

        {state.contextError ? <Text style={styles.errorText}>{state.contextError}</Text> : null}
        {state.saveError ? <Text style={styles.errorText}>{state.saveError}</Text> : null}

        <SaveButton saving={state.saving} disabled={saveDisabled} onPress={() => void handleSave()} />
      </ScrollView>

      <PickerModals
        openModal={state.openModal}
        onClose={() => dispatch({ type: 'close' })}
        cropOptions={cropOptions}
        selectedCrop={state.selectedCrop}
        onSelectCrop={(c) => dispatch({ type: 'selectCrop', crop: c })}
        pestOptions={state.pestOptions}
        selectedPest={state.selectedPest}
        onSelectPest={(p) => dispatch({ type: 'selectPest', pest: p })}
        category={state.category}
        onSelectCategory={(c) => dispatch({ type: 'setCategory', category: c })}
        severity={state.severity}
        onSelectSeverity={(s) => dispatch({ type: 'setSeverity', severity: s })}
        treatment={state.treatment}
        onSelectTreatment={(tm) => dispatch({ type: 'setTreatment', treatment: tm })}
      />
    </SafeAreaView>
  );
}
