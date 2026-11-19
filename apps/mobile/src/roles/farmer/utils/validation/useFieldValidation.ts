/**
 * Touched / blur / submit handling for a plain-TextInput form.
 *
 * The screen keeps owning its values (useState, a reducer, whatever it already
 * has); this hook only decides WHICH errors to show:
 *   - nothing while the farmer is typing into a field they have not left yet;
 *   - a field's error once it has been blurred (`onBlur(field)`);
 *   - every field's error after a submit attempt (`validateAll()`).
 * Errors are recomputed from the current values on every render, so fixing a
 * field clears its message immediately.
 *
 * The visibility rules live in the pure `visibleErrors` / reducer below so they
 * are unit-testable without a renderer.
 */
import { useCallback, useMemo, useReducer } from 'react';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { errorMessage, firstInvalidField, hasErrors, validateFields, type FieldErrors, type FieldRules } from './validateFields';
import type { FieldError } from './validators';

export interface ValidationVisibility<F extends string> {
  touched: Partial<Record<F, true>>;
  submitted: boolean;
}

export type ValidationAction<F extends string> =
  | { type: 'blur'; field: F }
  | { type: 'submit' }
  | { type: 'reset' };

export function initialVisibility<F extends string>(): ValidationVisibility<F> {
  return { touched: {}, submitted: false };
}

export function visibilityReducer<F extends string>(
  state: ValidationVisibility<F>,
  action: ValidationAction<F>,
): ValidationVisibility<F> {
  switch (action.type) {
    case 'blur':
      return state.touched[action.field] ? state : { ...state, touched: { ...state.touched, [action.field]: true } };
    case 'submit':
      return state.submitted ? state : { ...state, submitted: true };
    case 'reset':
      return initialVisibility<F>();
  }
}

/** The subset of `errors` the farmer should see right now. */
export function visibleErrors<F extends string>(errors: FieldErrors<F>, state: ValidationVisibility<F>): FieldErrors<F> {
  if (state.submitted) return errors;
  const shown: FieldErrors<F> = {};
  for (const field of Object.keys(errors) as F[]) {
    if (state.touched[field]) shown[field] = errors[field];
  }
  return shown;
}

export interface UseFieldValidationOptions<F extends string> {
  values: Readonly<Record<F, string>>;
  rules: FieldRules<F>;
  /** On-screen field order, so `firstInvalid` is the topmost failing field. */
  order?: readonly F[];
}

export interface FieldValidation<F extends string> {
  /** Every current error, shown or not. */
  allErrors: FieldErrors<F>;
  /** The errors to render now (touched fields, or all after a submit attempt). */
  errors: FieldErrors<F>;
  /** True when no field currently fails. */
  isValid: boolean;
  /** The topmost field with a VISIBLE error, for focus / scroll-to. */
  firstInvalid: F | null;
  submitted: boolean;
  /** Mark a field touched; wire to the TextInput's `onBlur`. */
  onBlur: (field: F) => void;
  /**
   * Marks the form submitted (all errors become visible) and reports the result
   * synchronously -- `firstInvalid` here is from ALL errors, so the submit handler
   * can focus it without waiting for the re-render.
   */
  validateAll: () => { valid: boolean; firstInvalid: F | null };
  /** Forget touched / submitted (e.g. after a successful save that clears the form). */
  reset: () => void;
  /** The visible error for `field`, rendered with the farmer `t()`; undefined when there is none. */
  messageFor: (field: F) => string | undefined;
  /** The visible error object for `field`. */
  errorFor: (field: F) => FieldError | undefined;
}

export function useFieldValidation<F extends string>(
  options: UseFieldValidationOptions<F>,
  translate: (key: TranslationKey, params?: Record<string, string | number>) => string = t,
): FieldValidation<F> {
  const { values, rules, order } = options;
  const [state, dispatch] = useReducer(visibilityReducer<F>, undefined, initialVisibility<F>);

  const allErrors = useMemo(() => validateFields(values, rules), [values, rules]);
  const errors = useMemo(() => visibleErrors(allErrors, state), [allErrors, state]);

  const onBlur = useCallback((field: F) => dispatch({ type: 'blur', field }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const validateAll = useCallback(() => {
    dispatch({ type: 'submit' });
    return { valid: !hasErrors(allErrors), firstInvalid: firstInvalidField(allErrors, order) };
  }, [allErrors, order]);
  const errorFor = useCallback((field: F) => errors[field], [errors]);
  const messageFor = useCallback((field: F) => errorMessage(errors[field], translate), [errors, translate]);

  return {
    allErrors,
    errors,
    isValid: !hasErrors(allErrors),
    firstInvalid: firstInvalidField(errors, order),
    submitted: state.submitted,
    onBlur,
    validateAll,
    reset,
    messageFor,
    errorFor,
  };
}
