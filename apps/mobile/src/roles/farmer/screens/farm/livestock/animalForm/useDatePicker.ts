import { useCallback, useMemo, useReducer } from 'react';
import { parseDisplayDate } from './model';

/** The date fields the calendar modal can edit. */
export type DateField = 'dob' | 'purchaseDate';

export interface DatePickerState {
  isOpen: boolean;
  field: DateField;
  /** The selected day. */
  date: Date;
  /** The month currently shown in the grid. */
  year: number;
  month: number;
  isYearPickerOpen: boolean;
}

type Action =
  | { type: 'open'; field: DateField; value: string }
  | { type: 'close' }
  | { type: 'prevMonth' }
  | { type: 'nextMonth' }
  | { type: 'toggleYearPicker' }
  | { type: 'pickYear'; year: number }
  | { type: 'pickDay'; day: number };

const LAST_MONTH = 11;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function reducer(state: DatePickerState, action: Action): DatePickerState {
  switch (action.type) {
    case 'open': {
      const parsed = parseDisplayDate(action.value);
      return {
        isOpen: true,
        field: action.field,
        date: parsed,
        year: parsed.getFullYear(),
        month: parsed.getMonth(),
        isYearPickerOpen: false,
      };
    }
    case 'close':
      return { ...state, isOpen: false };
    case 'prevMonth':
      return state.month === 0
        ? { ...state, month: LAST_MONTH, year: state.year - 1 }
        : { ...state, month: state.month - 1 };
    case 'nextMonth':
      return state.month === LAST_MONTH
        ? { ...state, month: 0, year: state.year + 1 }
        : { ...state, month: state.month + 1 };
    case 'toggleYearPicker':
      return { ...state, isYearPickerOpen: !state.isYearPickerOpen };
    case 'pickYear':
      // Keep the day, clamped to the new month length (31 Jan -> 28/29 Feb).
      return {
        ...state,
        year: action.year,
        date: new Date(
          action.year,
          state.month,
          Math.min(state.date.getDate(), daysInMonth(action.year, state.month)),
        ),
        isYearPickerOpen: false,
      };
    case 'pickDay':
      return { ...state, date: new Date(state.year, state.month, action.day) };
  }
}

/** Calendar modal state for RegisterAnimalScreen's date-of-birth / purchase-date fields. */
export function useDatePicker(initialValue: string) {
  const [state, dispatch] = useReducer(reducer, initialValue, (value): DatePickerState => {
    const parsed = parseDisplayDate(value);
    return {
      isOpen: false,
      field: 'dob',
      date: parsed,
      year: parsed.getFullYear(),
      month: parsed.getMonth(),
      isYearPickerOpen: false,
    };
  });

  const open = useCallback((field: DateField, value: string) => dispatch({ type: 'open', field, value }), []);

  const actions = useMemo(
    () => ({
      close: () => dispatch({ type: 'close' }),
      prevMonth: () => dispatch({ type: 'prevMonth' }),
      nextMonth: () => dispatch({ type: 'nextMonth' }),
      toggleYearPicker: () => dispatch({ type: 'toggleYearPicker' }),
      pickYear: (year: number) => dispatch({ type: 'pickYear', year }),
      pickDay: (day: number) => dispatch({ type: 'pickDay', day }),
    }),
    [],
  );

  return { state, open, ...actions };
}

export type DatePicker = ReturnType<typeof useDatePicker>;
