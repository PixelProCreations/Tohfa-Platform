import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ErrorState, SafeAreaView, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { getCropInput, type CropInputResponse } from '../../../api/crops';
import { authPalette as P, spacing } from '../../../theme';
import { AddInputAppliedScreen } from './AddInputAppliedScreen';

/**
 * Edit a stored crop input (BR-56l). Loads
 * GET /farmers/me/crops/:farmCropId/inputs/:id, then hands the record to the Add
 * Input Applied form in edit mode, which PATCHes the form's fields and offers
 * Delete (with a confirmation). Nothing is shown in the form until the real
 * record has loaded: a failed load is an error with Retry, never an empty form
 * that could overwrite the stored values.
 */
export interface EditInputAppliedScreenProps {
  farmCropId: string;
  inputId: string;
  /** Display only (the history row's crop and zone). */
  cropName?: string | null | undefined;
  zoneName?: string | null | undefined;
  onBack?: (() => void) | undefined;
  onSaved?: (() => void) | undefined;
  onDeleted?: (() => void) | undefined;
}

export function EditInputAppliedScreen({
  farmCropId,
  inputId,
  cropName,
  zoneName,
  onBack,
  onSaved,
  onDeleted,
}: EditInputAppliedScreenProps): React.JSX.Element {
  const [record, setRecord] = useState<CropInputResponse | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    getCropInput(farmCropId, inputId, controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return;
        setRecord(loaded);
        setState('ready');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRecord(null);
        setState('error');
      });
    return () => controller.abort();
  }, [farmCropId, inputId, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  if (state === 'ready' && record !== null) {
    return (
      <AddInputAppliedScreen
        existing={{ farmCropId, record, cropName, zoneName }}
        onBack={onBack}
        onSave={onSaved}
        onDeleted={onDeleted}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {state === 'loading' ? (
        <View testID="editInput.loading" style={styles.stateBox}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </View>
      ) : (
        <View testID="editInput.error" style={styles.stateBox}>
          <ErrorState message={t('farmer.editInput.loadError')} onRetry={retry} retryTitle={t('farmer.common.retry')} />
          {onBack ? (
            <Button title={t('farmer.inputHistory.back')} variant="outline" onPress={onBack} />
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  stateBox: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
