import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { BackHandler } from 'react-native';
import DocumentPicker from '../../../../native/documentPicker';
import { formatErrorMessage } from '../../../../../../shell/api/client';
import { getFarms, getPlots } from '../../../../api/farms';
import {
  createPestTreatmentLog,
  listPestLibrary,
  uploadPestPhoto,
  type CreatePestTreatmentLogInput,
  type PestCategory,
  type PestLibraryEntry,
  type PestSeverity,
  type PestTreatmentLog,
} from '../../../../api/pest';
import { useActiveCropItems, type CropItem } from '../../crops/cropItems';
import {
  CATEGORIES,
  SEVERITIES,
  TREATMENTS,
  addDaysDisplay,
  isoDateAfterDays,
  todayIso,
  tr,
} from './constants';
import { useFieldValidation } from '../../../../utils/validation';
import { PEST_TREATMENT_FIELD_ORDER, PEST_TREATMENT_RULES } from './validation';
import { appAlert } from '@tohfa/mobile-ui';

export type PestPhoto = { uri: string; name: string; type: string };
export type ModalKind = 'crop' | 'pest' | 'type' | 'severity' | 'treatment';

export interface LogPestTreatmentFormState {
  selectedCrop: CropItem | null;
  // Farm/zone context this treatment log is actually saved against.
  resolvedFarmId: string;
  resolvedPlotId: string;
  contextLoading: boolean;
  contextError: string | null;
  pestOptions: PestLibraryEntry[];
  pestOptionsLoading: boolean;
  pestOptionsError: string | null;
  selectedPest: PestLibraryEntry | null;
  category: PestCategory;
  severity: PestSeverity;
  treatment: string;
  intervalDays: string;
  phiDays: string;
  photo: PestPhoto | null;
  saving: boolean;
  saveError: string | null;
  /** Only one picker modal is ever open at a time. */
  openModal: ModalKind | null;
}

type Action =
  | { type: 'selectCrop'; crop: CropItem }
  | { type: 'defaultCrop'; crop: CropItem }
  | { type: 'contextStart' }
  | { type: 'contextFailed'; message: string }
  | { type: 'contextResolved'; farmId: string; plotId: string }
  | { type: 'contextDone' }
  | { type: 'pestOptionsStart' }
  | { type: 'pestOptionsLoaded'; items: PestLibraryEntry[] }
  | { type: 'pestOptionsFailed'; message: string }
  | { type: 'pestOptionsDone' }
  | { type: 'selectPest'; pest: PestLibraryEntry }
  | { type: 'setCategory'; category: PestCategory }
  | { type: 'setSeverity'; severity: PestSeverity }
  | { type: 'setTreatment'; treatment: string }
  | { type: 'setIntervalDays'; value: string }
  | { type: 'setPhiDays'; value: string }
  | { type: 'setPhoto'; photo: PestPhoto | null }
  | { type: 'saveStart' }
  | { type: 'saveFailed'; message: string }
  | { type: 'saveDone' }
  | { type: 'open'; modal: ModalKind }
  | { type: 'close' };

function pestDefaults(
  pest: PestLibraryEntry,
): Pick<LogPestTreatmentFormState, 'category' | 'severity' | 'treatment' | 'intervalDays' | 'phiDays'> {
  return {
    category: CATEGORIES.includes(pest.category as PestCategory) ? (pest.category as PestCategory) : 'Pest',
    severity: SEVERITIES.includes(pest.riskLevel as PestSeverity) ? (pest.riskLevel as PestSeverity) : 'Medium',
    treatment: pest.recommendedTreatment ?? TREATMENTS[0] ?? '',
    intervalDays: pest.intervalDays != null ? String(pest.intervalDays) : '',
    phiDays: pest.phiDays != null ? String(pest.phiDays) : '',
  };
}

function reducer(state: LogPestTreatmentFormState, action: Action): LogPestTreatmentFormState {
  switch (action.type) {
    case 'selectCrop':
      return { ...state, selectedCrop: action.crop, openModal: null };
    case 'defaultCrop':
      return { ...state, selectedCrop: action.crop };
    case 'contextStart':
      return { ...state, contextLoading: true, contextError: null };
    case 'contextFailed':
      return { ...state, contextError: action.message };
    case 'contextResolved':
      return { ...state, resolvedFarmId: action.farmId, resolvedPlotId: action.plotId };
    case 'contextDone':
      return { ...state, contextLoading: false };
    case 'pestOptionsStart':
      return { ...state, pestOptionsLoading: true, pestOptionsError: null };
    case 'pestOptionsLoaded': {
      const prev = state.selectedPest;
      if (prev && action.items.some((i) => i.id === prev.id)) {
        return { ...state, pestOptions: action.items };
      }
      const first = action.items[0];
      return first
        ? { ...state, pestOptions: action.items, selectedPest: first, ...pestDefaults(first) }
        : { ...state, pestOptions: action.items, selectedPest: null };
    }
    case 'pestOptionsFailed':
      return { ...state, pestOptionsError: action.message };
    case 'pestOptionsDone':
      return { ...state, pestOptionsLoading: false };
    case 'selectPest':
      return { ...state, selectedPest: action.pest, ...pestDefaults(action.pest), openModal: null };
    case 'setCategory':
      return { ...state, category: action.category, openModal: null };
    case 'setSeverity':
      return { ...state, severity: action.severity, openModal: null };
    case 'setTreatment':
      return { ...state, treatment: action.treatment, openModal: null };
    case 'setIntervalDays':
      return { ...state, intervalDays: action.value };
    case 'setPhiDays':
      return { ...state, phiDays: action.value };
    case 'setPhoto':
      return { ...state, photo: action.photo };
    case 'saveStart':
      return { ...state, saving: true, saveError: null };
    case 'saveFailed':
      return { ...state, saveError: action.message };
    case 'saveDone':
      return { ...state, saving: false };
    case 'open':
      return { ...state, openModal: action.modal };
    case 'close':
      return { ...state, openModal: null };
  }
}

export interface UseLogPestTreatmentFormArgs {
  crop: CropItem | null | undefined;
  farmId: string | undefined;
  plotId: string | undefined;
  onBack: (() => void) | undefined;
  onSave: ((data?: PestTreatmentLog) => void) | undefined;
}

export function useLogPestTreatmentForm({ crop, farmId, plotId, onBack, onSave }: UseLogPestTreatmentFormArgs) {
  const [state, dispatch] = useReducer(reducer, undefined, (): LogPestTreatmentFormState => ({
    selectedCrop: crop ?? null,
    resolvedFarmId: farmId ?? '',
    resolvedPlotId: plotId ?? '',
    contextLoading: true,
    contextError: null,
    pestOptions: [],
    pestOptionsLoading: true,
    pestOptionsError: null,
    selectedPest: null,
    category: 'Disease',
    severity: 'Low',
    treatment: TREATMENTS[0] ?? '',
    intervalDays: '',
    phiDays: '',
    photo: null,
    saving: false,
    saveError: null,
    openModal: null,
  }));

  const fieldValues = useMemo(
    () => ({ intervalDays: state.intervalDays, phiDays: state.phiDays }),
    [state.intervalDays, state.phiDays],
  );
  const validation = useFieldValidation({
    values: fieldValues,
    rules: PEST_TREATMENT_RULES,
    order: PEST_TREATMENT_FIELD_ORDER,
  });

  // Hardware back button for Android
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

  // Selected crop -- picked from the farmer's real active crops (cropItems.ts).
  // It is display/filter context only and is not sent as a `farmCropId` on the
  // create body below.
  const { items: cropOptions } = useActiveCropItems();
  const { selectedCrop } = state;
  useEffect(() => {
    if (!selectedCrop && cropOptions[0]) dispatch({ type: 'defaultCrop', crop: cropOptions[0] });
  }, [cropOptions, selectedCrop]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      dispatch({ type: 'contextStart' });
      try {
        let fid = farmId;
        if (!fid) {
          const farms = await getFarms();
          fid = farms[0]?.id;
        }
        if (!fid) {
          if (!cancelled) dispatch({ type: 'contextFailed', message: tr('error.noFarm') });
          return;
        }
        let pid = plotId;
        if (!pid) {
          const plots = await getPlots(fid);
          pid = plots[0]?.id;
        }
        if (!pid) {
          if (!cancelled) dispatch({ type: 'contextFailed', message: tr('error.noZone') });
          return;
        }
        if (!cancelled) dispatch({ type: 'contextResolved', farmId: fid, plotId: pid });
      } catch (err) {
        if (!cancelled) dispatch({ type: 'contextFailed', message: formatErrorMessage(err, tr('error.loadFarm')) });
      } finally {
        if (!cancelled) dispatch({ type: 'contextDone' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId, plotId]);

  // Pest / disease options, filtered to the selected crop -- listPestLibrary's
  // `crop` query already does a case-insensitive exact match against the
  // library's crops array, so no further client-side filtering is needed.
  const selectedCropName = selectedCrop?.name;
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      dispatch({ type: 'pestOptionsStart' });
      try {
        const items = await listPestLibrary(selectedCropName ? { crop: selectedCropName } : undefined);
        if (cancelled) return;
        dispatch({ type: 'pestOptionsLoaded', items });
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'pestOptionsFailed', message: formatErrorMessage(err, tr('error.loadPestLibrary')) });
        }
      } finally {
        if (!cancelled) dispatch({ type: 'pestOptionsDone' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCropName]);

  const handlePickPhoto = useCallback(async () => {
    try {
      const picked = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });
      dispatch({
        type: 'setPhoto',
        photo: {
          uri: picked.fileCopyUri ?? picked.uri,
          name: picked.name ?? 'pest_photo.jpg',
          type: picked.type ?? 'image/jpeg',
        },
      });
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        appAlert(tr('alert.photoFailedTitle'), formatErrorMessage(err, tr('error.tryAgain')), undefined, { tone: 'error' });
      }
    }
  }, []);

  const handleSave = async () => {
    if (!validation.validateAll().valid) return;
    const { selectedPest, resolvedFarmId, resolvedPlotId, photo, intervalDays, phiDays, category, severity, treatment } =
      state;
    if (!selectedPest) {
      appAlert(tr('alert.requiredTitle'), tr('alert.selectPest'), undefined, { tone: 'error' });
      return;
    }
    if (!resolvedFarmId || !resolvedPlotId) {
      appAlert(tr('alert.notReadyTitle'), tr('alert.notReadyMessage'), undefined, { tone: 'error' });
      return;
    }

    dispatch({ type: 'saveStart' });
    try {
      let photoUploadId: string | undefined;
      if (photo) {
        try {
          const uploaded = await uploadPestPhoto(photo.uri, photo.name, photo.type);
          photoUploadId = uploaded.uploadId;
        } catch {
          // Non-fatal: the treatment log itself is still worth saving.
        }
      }

      const intervalNum = intervalDays.trim() ? Number(intervalDays) : undefined;
      const phiNum = phiDays.trim() ? Number(phiDays) : undefined;

      const body: CreatePestTreatmentLogInput = {
        pestLibraryId: selectedPest.id,
        pestName: selectedPest.name,
        category,
        severity,
        treatment,
        appliedOn: todayIso(),
        ...(intervalNum !== undefined && !Number.isNaN(intervalNum) ? { intervalDays: intervalNum } : {}),
        ...(phiNum !== undefined && !Number.isNaN(phiNum) ? { phiDays: phiNum } : {}),
        ...(intervalNum ? { nextApplicationDate: isoDateAfterDays(intervalNum) } : {}),
        ...(photoUploadId ? { photoUploadId } : {}),
      };

      const created = await createPestTreatmentLog(resolvedFarmId, resolvedPlotId, body);

      appAlert(
        tr('alert.loggedTitle'),
        tr('alert.loggedMessage', { treatment, pest: selectedPest.name }),
        [
          {
            text: tr('alert.ok'),
            onPress: () => {
              if (onSave) {
                onSave(created);
              } else if (onBack) {
                onBack();
              }
            },
          },
        ],
        { tone: 'success' },
      );
    } catch (err) {
      dispatch({ type: 'saveFailed', message: formatErrorMessage(err, tr('error.saveFailed')) });
    } finally {
      dispatch({ type: 'saveDone' });
    }
  };

  const nextDateDisplay =
    state.intervalDays.trim() && !Number.isNaN(Number(state.intervalDays))
      ? addDaysDisplay(Number(state.intervalDays))
      : addDaysDisplay(0);

  return { state, dispatch, validation, cropOptions, handlePickPhoto, handleSave, nextDateDisplay };
}
