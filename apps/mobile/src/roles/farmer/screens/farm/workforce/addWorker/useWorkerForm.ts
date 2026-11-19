import { useEffect, useReducer } from 'react';
import { appAlert } from '@tohfa/mobile-ui';
import DocumentPicker from '../../../../native/documentPicker';
import { formatErrorMessage } from '../../../../../../shell/api/client';
import { getFarms } from '../../../../api/farms';
import {
  createMyWorker,
  getMyWorker,
  updateMyWorker,
  uploadWorkerIdProof,
  uploadWorkerPhoto,
  type CreateWorkerInput,
  type UpdateWorkerInput,
} from '../../../../api/workforce';
import type { AddWorkerScreenProps, WorkerFormData } from '../AddWorkerScreen';
import { formatDisplayDate, parseDisplayDate, toIsoDate } from './dateUtils';
import { formReducer, initFormState } from './formReducer';
import { aw, common } from './i18n';
import { rupeesToPaise } from './money';
import { useFieldValidation } from '../../../../utils/validation';
import { WORKER_FIELD_ORDER, WORKER_RULES, type WorkerField } from './workerRules';

export function useWorkerForm({ farmId, initialWorker, onBack, onCancel, onSave }: AddWorkerScreenProps) {
  const isEditing = Boolean(initialWorker?.id || initialWorker?.name);
  const [state, dispatch] = useReducer(formReducer, undefined, () => initFormState(farmId, initialWorker));
  const { resolvedFarmId } = state;

  const validation = useFieldValidation<WorkerField>({
    values: {
      name: state.name,
      accountNo: state.accountNo,
      ifsc: state.ifsc,
      upiId: state.upiId,
      wageAmount: state.wageAmount,
    },
    rules: WORKER_RULES,
    order: WORKER_FIELD_ORDER,
  });

  // Farm context (same self-resolution pattern as WorkforceScreen.tsx).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let fid = farmId;
        if (!fid) {
          const farms = await getFarms();
          fid = farms[0]?.id;
        }
        if (fid && !cancelled) dispatch({ type: 'patch', patch: { resolvedFarmId: fid } });
      } catch {
        // Swallowed: this is a background pre-fetch for the edit-mode worker
        // load below; handleSave resolves the farm again on demand at save
        // time, so a failure here just means that retry does the work instead.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  // Full worker record (edit mode). App.tsx's WorkerDetailScreen -> AddWorker
  // navigation only forwards {id, name, role}, so the real bank/pay/DOB fields
  // for an existing worker are fetched here rather than trusted from
  // initialWorker.
  useEffect(() => {
    if (!isEditing || !initialWorker?.id || !resolvedFarmId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const w = await getMyWorker(resolvedFarmId, initialWorker.id!);
        if (cancelled) return;
        const dob = w.dateOfBirth ? formatDisplayDate(new Date(`${w.dateOfBirth}T00:00:00`)) : '';
        // The server only stores an upload id, never a filename -- there is no
        // real filename to show, so the id-proof name stays blank.
        dispatch({ type: 'workerLoaded', worker: w, dob });
      } catch {
        // Swallowed: the form still renders with whatever initialWorker gave it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditing, initialWorker?.id, resolvedFarmId]);

  const handleConfirmDate = () => {
    dispatch({ type: 'confirmDate', dob: formatDisplayDate(state.calendarDate) });
  };

  const handleSave = async () => {
    const {
      name, dob, gender, idProofName, accountNo, ifsc, upiId, salaryType, wageAmount,
      fetchedWorker, idProofUploadId, photoUploadId,
    } = state;
    // Field errors render inline under each input (see WorkerFormFields).
    if (!validation.validateAll().valid) return;
    const payRatePaise = rupeesToPaise(wageAmount);
    // Backstop only: positiveAmount() has already accepted the wage, so this is
    // unreachable unless the two parsers drift apart.
    if (payRatePaise === null) {
      appAlert(
        aw('alert.requiredTitle'),
        salaryType === 'daily' ? aw('alert.dailyWageRequired') : aw('alert.monthlySalaryRequired'),
        undefined,
        { tone: 'warning' },
      );
      return;
    }
    const dateOfBirth = dob.trim() ? toIsoDate(parseDisplayDate(dob)) : undefined;

    dispatch({ type: 'patch', patch: { saving: true } });
    try {
      // The farmId prop (or the background getFarms() call above) may not have
      // resolved yet; resolve it here on demand so Save never depends on timing.
      let saveFarmId = resolvedFarmId;
      if (!saveFarmId) {
        const farms = await getFarms();
        saveFarmId = farms[0]?.id ?? '';
        if (saveFarmId) dispatch({ type: 'patch', patch: { resolvedFarmId: saveFarmId } });
      }
      if (!saveFarmId) {
        appAlert(aw('alert.noFarmTitle'), aw('alert.noFarmBody'), undefined, { tone: 'error' });
        dispatch({ type: 'patch', patch: { saving: false } });
        return;
      }

      const workerId = fetchedWorker?.id ?? initialWorker?.id;
      if (isEditing && workerId) {
        const input: UpdateWorkerInput = {
          name: name.trim(),
          dateOfBirth: dateOfBirth ?? null,
          gender,
          bankAccountNo: accountNo.trim() || null,
          ifscCode: ifsc.trim() || null,
          upiId: upiId.trim() || null,
          payType: salaryType,
          payRatePaise,
          ...(idProofUploadId ? { idProofUploadId } : {}),
          ...(photoUploadId ? { photoUploadId } : {}),
        };
        await updateMyWorker(saveFarmId, workerId, input);
      } else {
        const input: CreateWorkerInput = {
          name: name.trim(),
          ...(dateOfBirth ? { dateOfBirth } : {}),
          gender,
          ...(accountNo.trim() ? { bankAccountNo: accountNo.trim() } : {}),
          ...(ifsc.trim() ? { ifscCode: ifsc.trim() } : {}),
          ...(upiId.trim() ? { upiId: upiId.trim() } : {}),
          payType: salaryType,
          payRatePaise,
          ...(idProofUploadId ? { idProofUploadId } : {}),
          ...(photoUploadId ? { photoUploadId } : {}),
        };
        await createMyWorker(saveFarmId, input);
      }

      const payload: WorkerFormData = {
        id: workerId || `w-${Date.now()}`,
        name: name.trim(),
        dob,
        gender,
        idProofName,
        accountNo,
        ifsc,
        upiId,
        salaryType,
        wageAmount,
      };

      if (onSave) {
        onSave(payload);
      } else {
        appAlert(
          isEditing ? aw('alert.updatedTitle') : aw('alert.addedTitle'),
          aw('alert.savedBody', { name: name.trim() }),
          [{ text: common.ok(), onPress: onBack || onCancel }],
          { tone: 'success' },
        );
      }
    } catch (err) {
      appAlert(aw('alert.couldNotSave'), formatErrorMessage(err, aw('alert.tryAgain')), undefined, { tone: 'error' });
    } finally {
      dispatch({ type: 'patch', patch: { saving: false } });
    }
  };

  const handleUploadDoc = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
      });
      const uri = picked.fileCopyUri ?? picked.uri;
      const fileName = picked.name ?? 'id_proof';
      dispatch({ type: 'patch', patch: { idProofName: fileName } });
      try {
        const uploaded = await uploadWorkerIdProof(uri, fileName, picked.type ?? 'application/octet-stream');
        dispatch({ type: 'patch', patch: { idProofUploadId: uploaded.uploadId } });
      } catch (err) {
        appAlert(aw('alert.uploadFailed'), formatErrorMessage(err, aw('alert.idProofUploadFailed')), undefined, {
          tone: 'error',
        });
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        appAlert(aw('alert.couldNotAttachDoc'), formatErrorMessage(err, aw('alert.tryAgain')), undefined, {
          tone: 'error',
        });
      }
    }
  };

  const handlePickPhoto = async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      const uri = picked.fileCopyUri ?? picked.uri;
      dispatch({ type: 'patch', patch: { photoUri: uri } });
      try {
        const uploaded = await uploadWorkerPhoto(uri, picked.name ?? 'worker_photo.jpg', picked.type ?? 'image/jpeg');
        dispatch({ type: 'patch', patch: { photoUploadId: uploaded.uploadId } });
      } catch (err) {
        appAlert(aw('alert.uploadFailed'), formatErrorMessage(err, aw('alert.photoUploadFailed')), undefined, {
          tone: 'error',
        });
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        appAlert(aw('alert.couldNotAttachPhoto'), formatErrorMessage(err, aw('alert.tryAgain')), undefined, {
          tone: 'error',
        });
      }
    }
  };

  return { state, dispatch, validation, isEditing, handleSave, handleUploadDoc, handlePickPhoto, handleConfirmDate };
}
