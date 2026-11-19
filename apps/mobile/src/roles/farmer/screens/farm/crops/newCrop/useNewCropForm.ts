import { useMemo, useReducer } from 'react';
import type { CropMasterResponse, SeedQuantityUnit } from '../../../../api/crops';
import type { DiaryPlot } from '../../../../api/farmDiary';
import { addMaturityDays, formatDisplayDate, parseDisplayDate, type UiGrade } from './constants';

export type DateField = 'plantation' | 'harvest';

export interface NewCropFormState {
  step: 1 | 2;

  // Real picker data (crop_master + this farmer's plots), loaded once on mount.
  plots: DiaryPlot[];
  cropMasterList: CropMasterResponse[];
  loadingOptions: boolean;
  optionsError: unknown | null;

  // Step 1: Basic
  cropName: string;
  selectedCropMasterId: string | null;
  seedVariety: string;
  seedCompany: string;
  quantityUsed: string;
  quantityUnit: SeedQuantityUnit;
  costRs: string;

  // Step 2: Dates & Grade
  selectedZone: string;
  selectedPlotId: string | null;
  areaAcres: string;
  plantationDate: string;
  expectedHarvestDate: string;
  expectedQtyKg: string;
  expectedGrade: UiGrade;

  // Submit state
  isSubmitting: boolean;
  submitError: string;
  fieldErrors: Record<string, string>;

  // Modal pickers
  showCropPicker: boolean;
  showUnitPicker: boolean;
  showZonePicker: boolean;

  // Calendar modal
  showDatePicker: boolean;
  activeDateField: DateField;
  calendarViewYear: number;
  calendarViewMonth: number;
  selectedCalendarDate: Date;
}

/** Fields a caller may set directly with `set`. */
export type NewCropFormPatch = Partial<NewCropFormState>;

type Action =
  | { type: 'set'; patch: NewCropFormPatch }
  | { type: 'optionsLoaded'; plots: DiaryPlot[]; crops: CropMasterResponse[] }
  | { type: 'selectCrop'; crop: CropMasterResponse }
  | { type: 'selectZone'; plot: DiaryPlot }
  | { type: 'openCalendar'; field: DateField }
  | { type: 'prevMonth' }
  | { type: 'nextMonth' }
  | { type: 'confirmDate' };

function areaText(plot: DiaryPlot): string {
  return plot.areaAcres !== null ? String(plot.areaAcres) : '';
}

function initialState(): NewCropFormState {
  const now = new Date();
  return {
    step: 1,
    plots: [],
    cropMasterList: [],
    loadingOptions: true,
    optionsError: null,
    cropName: '',
    selectedCropMasterId: null,
    seedVariety: '',
    seedCompany: '',
    quantityUsed: '',
    quantityUnit: 'grams',
    costRs: '',
    selectedZone: '',
    selectedPlotId: null,
    areaAcres: '',
    plantationDate: formatDisplayDate(now),
    expectedHarvestDate: formatDisplayDate(addMaturityDays(new Date(Date.now()))),
    expectedQtyKg: '',
    expectedGrade: 'Grade A',
    isSubmitting: false,
    submitError: '',
    fieldErrors: {},
    showCropPicker: false,
    showUnitPicker: false,
    showZonePicker: false,
    showDatePicker: false,
    activeDateField: 'plantation',
    calendarViewYear: now.getFullYear(),
    calendarViewMonth: now.getMonth(),
    selectedCalendarDate: now,
  };
}

function reducer(state: NewCropFormState, action: Action): NewCropFormState {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.patch };
    case 'optionsLoaded': {
      const next: NewCropFormState = {
        ...state,
        plots: action.plots,
        cropMasterList: action.crops,
      };
      const firstPlot = action.plots[0];
      if (firstPlot) {
        next.selectedZone = firstPlot.name;
        next.selectedPlotId = firstPlot.id;
        next.areaAcres = areaText(firstPlot);
      }
      const firstCrop = action.crops[0];
      if (firstCrop) {
        next.cropName = firstCrop.name;
        next.selectedCropMasterId = firstCrop.id;
      }
      return next;
    }
    case 'selectCrop':
      return {
        ...state,
        cropName: action.crop.name,
        selectedCropMasterId: action.crop.id,
        showCropPicker: false,
      };
    // When the plot changes, auto-fill Area from the plot's own recorded size
    // (informational display only — CreateFarmCropBody has no area field).
    case 'selectZone':
      return {
        ...state,
        selectedZone: action.plot.name,
        selectedPlotId: action.plot.id,
        areaAcres: areaText(action.plot),
        showZonePicker: false,
      };
    case 'openCalendar': {
      const initialDate = parseDisplayDate(
        action.field === 'plantation' ? state.plantationDate : state.expectedHarvestDate,
      );
      return {
        ...state,
        activeDateField: action.field,
        selectedCalendarDate: initialDate,
        calendarViewYear: initialDate.getFullYear(),
        calendarViewMonth: initialDate.getMonth(),
        showDatePicker: true,
      };
    }
    case 'prevMonth':
      return state.calendarViewMonth === 0
        ? { ...state, calendarViewMonth: 11, calendarViewYear: state.calendarViewYear - 1 }
        : { ...state, calendarViewMonth: state.calendarViewMonth - 1 };
    case 'nextMonth':
      return state.calendarViewMonth === 11
        ? { ...state, calendarViewMonth: 0, calendarViewYear: state.calendarViewYear + 1 }
        : { ...state, calendarViewMonth: state.calendarViewMonth + 1 };
    case 'confirmDate': {
      const formatted = formatDisplayDate(state.selectedCalendarDate);
      if (state.activeDateField === 'plantation') {
        // Auto-suggest harvest date. See DEFAULT_MATURITY_DAYS's docblock for
        // why this can't be looked up per-crop today.
        return {
          ...state,
          plantationDate: formatted,
          expectedHarvestDate: formatDisplayDate(addMaturityDays(state.selectedCalendarDate)),
          showDatePicker: false,
        };
      }
      return { ...state, expectedHarvestDate: formatted, showDatePicker: false };
    }
  }
}

export interface NewCropFormApi {
  state: NewCropFormState;
  set: (patch: NewCropFormPatch) => void;
  optionsLoaded: (plots: DiaryPlot[], crops: CropMasterResponse[]) => void;
  selectCrop: (crop: CropMasterResponse) => void;
  selectZone: (plot: DiaryPlot) => void;
  openCalendar: (field: DateField) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  confirmDate: () => void;
}

export function useNewCropForm(): NewCropFormApi {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  // dispatch is referentially stable, so the action creators are too; callers
  // can safely close over them in a mount-only effect / useCallback([]).
  const actions = useMemo(
    () => ({
      set: (patch: NewCropFormPatch) => dispatch({ type: 'set', patch }),
      optionsLoaded: (plots: DiaryPlot[], crops: CropMasterResponse[]) =>
        dispatch({ type: 'optionsLoaded', plots, crops }),
      selectCrop: (crop: CropMasterResponse) => dispatch({ type: 'selectCrop', crop }),
      selectZone: (plot: DiaryPlot) => dispatch({ type: 'selectZone', plot }),
      openCalendar: (field: DateField) => dispatch({ type: 'openCalendar', field }),
      prevMonth: () => dispatch({ type: 'prevMonth' }),
      nextMonth: () => dispatch({ type: 'nextMonth' }),
      confirmDate: () => dispatch({ type: 'confirmDate' }),
    }),
    [],
  );
  return { state, ...actions };
}
