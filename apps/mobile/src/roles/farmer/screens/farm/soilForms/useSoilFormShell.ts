import { useCallback, useEffect, useReducer } from 'react';
import { BackHandler } from 'react-native';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { getPlots, type Plot } from '../../../api/farms';
import { SHARED_KEYS, sf, t } from './i18n';

/**
 * State shared by both soil forms: the zone list, picker/date-picker
 * visibility, the save lifecycle and the success payload. Each screen keeps its
 * own field values (see `useFormFields`) and its own validation / submit.
 */
interface ShellState<S> {
  plots: Plot[];
  selectedPlotId: string;
  plotsLoading: boolean;
  plotsError: string | null;
  zonePickerVisible: boolean;
  datePickerVisible: boolean;
  saving: boolean;
  saveError: string | null;
  successData: S | null;
}

type ShellAction<S> =
  | { type: 'plotsNoFarm'; message: string }
  | { type: 'plotsLoadStart' }
  | { type: 'plotsLoaded'; plots: Plot[]; selectionAtLoad: string }
  | { type: 'plotsLoadFailed'; message: string }
  | { type: 'plotsLoadDone' }
  | { type: 'selectPlot'; plotId: string }
  | { type: 'setZonePicker'; visible: boolean }
  | { type: 'setDatePicker'; visible: boolean }
  | { type: 'setSaveError'; message: string | null }
  | { type: 'setSaving'; saving: boolean }
  | { type: 'setSuccess'; data: S | null };

function shellReducer<S>(state: ShellState<S>, action: ShellAction<S>): ShellState<S> {
  switch (action.type) {
    case 'plotsNoFarm':
      return { ...state, plotsLoading: false, plotsError: action.message };
    case 'plotsLoadStart':
      return { ...state, plotsLoading: true, plotsError: null };
    case 'plotsLoaded': {
      // Default to the first zone only when nothing was selected when the load began.
      const first = action.plots[0];
      const selectedPlotId = !action.selectionAtLoad && first ? first.id : state.selectedPlotId;
      return { ...state, plots: action.plots, selectedPlotId };
    }
    case 'plotsLoadFailed':
      return { ...state, plotsError: action.message };
    case 'plotsLoadDone':
      return { ...state, plotsLoading: false };
    case 'selectPlot':
      return { ...state, selectedPlotId: action.plotId, zonePickerVisible: false };
    case 'setZonePicker':
      return { ...state, zonePickerVisible: action.visible };
    case 'setDatePicker':
      return { ...state, datePickerVisible: action.visible };
    case 'setSaveError':
      return { ...state, saveError: action.message };
    case 'setSaving':
      return { ...state, saving: action.saving };
    case 'setSuccess':
      return { ...state, successData: action.data };
    default:
      return state;
  }
}

interface ShellOptions {
  farmId: string;
  initialPlotId?: string | undefined;
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
}

export function useSoilFormShell<S>({ farmId, initialPlotId, onBack, onSave }: ShellOptions) {
  const [state, dispatch] = useReducer(shellReducer<S>, {
    plots: [],
    selectedPlotId: initialPlotId ?? '',
    plotsLoading: true,
    plotsError: null,
    zonePickerVisible: false,
    datePickerVisible: false,
    saving: false,
    saveError: null,
    successData: null,
  });

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

  const { selectedPlotId } = state;

  // Depends on selectedPlotId (as before the refactor), so the zone list is
  // re-fetched whenever the selection changes.
  const loadPlots = useCallback(async () => {
    if (!farmId) {
      dispatch({ type: 'plotsNoFarm', message: t(SHARED_KEYS.noFarm) });
      return;
    }
    dispatch({ type: 'plotsLoadStart' });
    try {
      const list = await getPlots(farmId);
      dispatch({ type: 'plotsLoaded', plots: list, selectionAtLoad: selectedPlotId });
    } catch (err) {
      dispatch({
        type: 'plotsLoadFailed',
        message: formatErrorMessage(err, sf('common.loadZonesError')),
      });
    } finally {
      dispatch({ type: 'plotsLoadDone' });
    }
  }, [farmId, selectedPlotId]);

  useEffect(() => {
    void loadPlots();
  }, [loadPlots]);

  const selectedPlotName =
    state.plots.find((p) => p.id === selectedPlotId)?.name ?? t(SHARED_KEYS.selectZone);

  /**
   * Runs a validated submit: clears the banner, lets `validate` reject with a
   * message, then wraps `submit` in the saving flag and maps failures to the
   * banner using `failureMessage` as the fallback text.
   */
  const runSave = async (
    validate: () => string | null,
    submit: () => Promise<S>,
    failureMessage: string,
  ): Promise<void> => {
    dispatch({ type: 'setSaveError', message: null });
    const invalid = validate();
    if (invalid) {
      dispatch({ type: 'setSaveError', message: invalid });
      return;
    }
    dispatch({ type: 'setSaving', saving: true });
    try {
      const data = await submit();
      dispatch({ type: 'setSuccess', data });
    } catch (err) {
      dispatch({ type: 'setSaveError', message: formatErrorMessage(err, failureMessage) });
    } finally {
      dispatch({ type: 'setSaving', saving: false });
    }
  };

  const closeSuccess = () => {
    dispatch({ type: 'setSuccess', data: null });
    if (onSave) {
      onSave();
    } else if (onBack) {
      onBack();
    }
  };

  return {
    state,
    selectedPlotName,
    runSave,
    closeSuccess,
    selectPlot: (plotId: string) => dispatch({ type: 'selectPlot', plotId }),
    setZonePickerVisible: (visible: boolean) => dispatch({ type: 'setZonePicker', visible }),
    setDatePickerVisible: (visible: boolean) => dispatch({ type: 'setDatePicker', visible }),
  };
}

/** Field values for a form, as one reducer instead of one useState per field. */
export function useFormFields<F extends Record<string, string>>(initial: F | (() => F)) {
  const [values, dispatch] = useReducer(
    (prev: F, patch: Partial<F> | ((p: F) => Partial<F>)) => ({
      ...prev,
      ...(typeof patch === 'function' ? patch(prev) : patch),
    }),
    undefined,
    () => (typeof initial === 'function' ? initial() : initial),
  );
  const setField = useCallback(
    <K extends keyof F>(key: K) =>
      (value: F[K]) =>
        dispatch({ [key]: value } as unknown as Partial<F>),
    [],
  );
  return { values, update: dispatch, setField };
}
