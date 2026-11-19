import type { Worker } from '../../../../api/workforce';
import { parseDisplayDate } from './dateUtils';

export type Gender = 'Male' | 'Female' | 'Other';
export type SalaryType = 'daily' | 'monthly';

export const GENDER_OPTIONS: readonly Gender[] = ['Male', 'Female', 'Other'];

export interface InitialWorkerValues {
  name?: string | undefined;
  dob?: string | undefined;
  gender?: Gender | undefined;
  idProofName?: string | undefined;
  accountNo?: string | undefined;
  ifsc?: string | undefined;
  upiId?: string | undefined;
  salaryType?: SalaryType | undefined;
  wageAmount?: string | undefined;
}

export interface FormState {
  resolvedFarmId: string;
  fetchedWorker: Worker | null;
  name: string;
  dob: string;
  gender: Gender;
  isGenderPickerOpen: boolean;
  isDatePickerOpen: boolean;
  calendarDate: Date;
  calendarYear: number;
  calendarMonth: number;
  isYearPickerOpen: boolean;
  idProofName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  salaryType: SalaryType;
  wageAmount: string;
  photoUri: string | null;
  saving: boolean;
  // `POST /uploads/sign` returns the uploads-table row id alongside the signed
  // target so the id proof / photo can be linked to the worker on save.
  idProofUploadId: string | undefined;
  photoUploadId: string | undefined;
}

export type FormAction =
  | { type: 'patch'; patch: Partial<FormState> }
  | { type: 'openDatePicker' }
  | { type: 'prevMonth' }
  | { type: 'nextMonth' }
  | { type: 'confirmDate'; dob: string }
  | { type: 'pickYear'; year: number }
  | { type: 'workerLoaded'; worker: Worker; dob: string };

export function initFormState(farmId: string | undefined, initial: InitialWorkerValues | undefined): FormState {
  const dob = initial?.dob || '';
  const parsed = parseDisplayDate(dob);
  return {
    resolvedFarmId: farmId ?? '',
    fetchedWorker: null,
    name: initial?.name || '',
    dob,
    gender: initial?.gender || 'Male',
    isGenderPickerOpen: false,
    isDatePickerOpen: false,
    calendarDate: parsed,
    calendarYear: parsed.getFullYear(),
    calendarMonth: parsed.getMonth(),
    isYearPickerOpen: false,
    idProofName: initial?.idProofName || '',
    accountNo: initial?.accountNo || '',
    ifsc: initial?.ifsc || '',
    upiId: initial?.upiId || '',
    salaryType: initial?.salaryType || 'daily',
    wageAmount: initial?.wageAmount || '',
    photoUri: null,
    saving: false,
    idProofUploadId: undefined,
    photoUploadId: undefined,
  };
}

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'openDatePicker': {
      const parsed = parseDisplayDate(state.dob);
      return {
        ...state,
        calendarDate: parsed,
        calendarYear: parsed.getFullYear(),
        calendarMonth: parsed.getMonth(),
        isYearPickerOpen: false,
        isDatePickerOpen: true,
      };
    }
    case 'prevMonth':
      return state.calendarMonth === 0
        ? { ...state, calendarMonth: 11, calendarYear: state.calendarYear - 1 }
        : { ...state, calendarMonth: state.calendarMonth - 1 };
    case 'nextMonth':
      return state.calendarMonth === 11
        ? { ...state, calendarMonth: 0, calendarYear: state.calendarYear + 1 }
        : { ...state, calendarMonth: state.calendarMonth + 1 };
    case 'confirmDate':
      return { ...state, dob: action.dob, isDatePickerOpen: false };
    case 'pickYear': {
      const y = action.year;
      const lastDay = new Date(y, state.calendarMonth + 1, 0).getDate();
      return {
        ...state,
        calendarYear: y,
        calendarDate: new Date(y, state.calendarMonth, Math.min(state.calendarDate.getDate(), lastDay)),
        isYearPickerOpen: false,
      };
    }
    case 'workerLoaded': {
      const w = action.worker;
      return {
        ...state,
        fetchedWorker: w,
        name: w.name,
        dob: action.dob,
        gender: w.gender === 'Female' || w.gender === 'Other' ? w.gender : 'Male',
        accountNo: w.bankAccountNo ?? '',
        ifsc: w.ifscCode ?? '',
        upiId: w.upiId ?? '',
        salaryType: w.payType === 'monthly' ? 'monthly' : 'daily',
        wageAmount: String(Math.round(w.payRatePaise / 100)),
      };
    }
  }
}
