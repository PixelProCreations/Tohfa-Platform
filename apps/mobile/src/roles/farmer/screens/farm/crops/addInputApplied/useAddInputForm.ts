import { useReducer } from 'react';
import {
  FERTIGATION_DEFAULTS,
  PEST_DEFAULTS,
  SAMPLE_DATE_TIME,
  type InputType,
} from './constants';

export type PickerKind = 'unit' | 'purpose' | 'pest' | 'appliedBy';

export interface FormState {
  inputType: InputType;
  productName: string;
  quantity: string;
  unit: string;
  dateTime: string;
  purpose: string;
  targetPest: string;
  appliedBy: string;
  notes: string;
  /** Which dropdown modal is open (only one at a time). */
  openPicker: PickerKind | null;
}

type TextField = 'productName' | 'quantity' | 'dateTime' | 'notes';
type PickField = 'unit' | 'purpose' | 'targetPest' | 'appliedBy';

type Action =
  | { type: 'text'; field: TextField; value: string }
  | { type: 'pick'; field: PickField; value: string }
  | { type: 'selectType'; value: InputType }
  | { type: 'openPicker'; picker: PickerKind | null };

export function initialFormState(initialInputType: InputType | undefined): FormState {
  const defaults = initialInputType === 'Fertigation' ? FERTIGATION_DEFAULTS : PEST_DEFAULTS;
  return {
    inputType: initialInputType ?? 'Pest Treatment',
    productName: '',
    quantity: defaults.quantity,
    unit: defaults.unit,
    dateTime: SAMPLE_DATE_TIME,
    purpose: 'General nutrition',
    targetPest: 'Aphids',
    appliedBy: 'Self',
    notes: '',
    openPicker: null,
  };
}

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'text':
      return { ...state, [action.field]: action.value };
    case 'pick':
      // Picking a value always dismisses the dropdown that offered it.
      return { ...state, [action.field]: action.value, openPicker: null };
    case 'openPicker':
      return { ...state, openPicker: action.picker };
    case 'selectType': {
      // Swap quantity/unit only while they still hold the other type's
      // untouched defaults, so a farmer's own edits are never overwritten.
      const next: FormState = { ...state, inputType: action.value };
      if (action.value === 'Fertigation') {
        if (state.unit === PEST_DEFAULTS.unit) next.unit = FERTIGATION_DEFAULTS.unit;
        if (state.quantity === PEST_DEFAULTS.quantity) next.quantity = FERTIGATION_DEFAULTS.quantity;
      } else {
        if (state.unit === FERTIGATION_DEFAULTS.unit) next.unit = PEST_DEFAULTS.unit;
        if (state.quantity === FERTIGATION_DEFAULTS.quantity) next.quantity = PEST_DEFAULTS.quantity;
      }
      return next;
    }
  }
}

export function useAddInputForm(initialInputType: InputType | undefined) {
  const [state, dispatch] = useReducer(reducer, initialInputType, initialFormState);
  return {
    state,
    setText: (field: TextField, value: string) => dispatch({ type: 'text', field, value }),
    pick: (field: PickField, value: string) => dispatch({ type: 'pick', field, value }),
    selectType: (value: InputType) => dispatch({ type: 'selectType', value }),
    openPicker: (picker: PickerKind) => dispatch({ type: 'openPicker', picker }),
    closePicker: () => dispatch({ type: 'openPicker', picker: null }),
  };
}
