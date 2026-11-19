import { useCallback, useReducer } from 'react';
import type { FormGender, FormOrganicStatus, FormSource } from './model';

/** The option-list modals; at most one is open at a time. */
export type OptionPicker = 'species' | 'gender' | 'status';

export interface AnimalFormValues {
  tag: string;
  name: string | undefined;
  species: string;
  gender: FormGender;
  breed: string;
  dob: string;
  source: FormSource;
  purchaseDate: string;
  sourceFarm: string;
  organicStatus: FormOrganicStatus;
}

export interface AnimalFormState extends AnimalFormValues {
  openPicker: OptionPicker | null;
  isSubmitting: boolean;
  submitError: string;
  fieldErrors: Record<string, string>;
}

type Action = { type: 'patch'; patch: Partial<AnimalFormState> };

function reducer(state: AnimalFormState, action: Action): AnimalFormState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
  }
}

/**
 * Form state shared by RegisterAnimalScreen and EditAnimalScreen: the field
 * values (form identifiers, see model.ts), which picker is open, and the
 * submit status. Each screen supplies its own initial values and keeps its own
 * load / submit logic.
 */
export function useAnimalForm(initial: AnimalFormValues) {
  const [state, dispatch] = useReducer(reducer, initial, (values): AnimalFormState => ({
    ...values,
    openPicker: null,
    isSubmitting: false,
    submitError: '',
    fieldErrors: {},
  }));

  const patch = useCallback((p: Partial<AnimalFormState>) => dispatch({ type: 'patch', patch: p }), []);

  const setField = useCallback(
    <K extends keyof AnimalFormValues>(field: K, value: AnimalFormValues[K]) =>
      dispatch({ type: 'patch', patch: { [field]: value } as Partial<AnimalFormState> }),
    [],
  );

  return { state, patch, setField };
}

export type AnimalForm = ReturnType<typeof useAnimalForm>;
