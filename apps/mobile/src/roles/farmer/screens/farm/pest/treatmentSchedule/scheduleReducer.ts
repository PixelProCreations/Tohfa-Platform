import type {
  PestDetection,
  PestRepeatInterval,
  PestTreatmentReminder,
} from '../../../../api/pest';
import {
  DEFAULT_SCHEDULE_DAY,
  DEFAULT_SCHEDULE_MONTH,
  DEFAULT_SCHEDULE_YEAR,
  type ReminderTab,
} from './constants';
import { formatDisplayDate } from './dateUtils';

export interface ScheduleState {
  // Farm / zone resolution
  resolvedFarmId: string;
  resolvedPlotId: string;
  contextLoading: boolean;
  contextError: string | null;
  // Reminder list
  activeTab: ReminderTab;
  reminders: PestTreatmentReminder[];
  remindersLoading: boolean;
  remindersError: string | null;
  detections: PestDetection[];
  // Add-reminder modal
  isAddModalOpen: boolean;
  linkedDetectionId: string | null;
  isDetectionPickerOpen: boolean;
  treatmentName: string;
  scheduledDate: string;
  repeatOption: PestRepeatInterval;
  isRepeatPickerOpen: boolean;
  notes: string;
  saving: boolean;
  saveError: string | null;
  // Calendar overlay
  isCalendarOpen: boolean;
  calDate: Date;
  calYear: number;
  calMonth: number;
  isYearPickerOpen: boolean;
}

export type ScheduleAction =
  | { type: 'patch'; patch: Partial<ScheduleState> }
  | { type: 'prevMonth' }
  | { type: 'nextMonth' }
  | { type: 'replaceReminder'; reminder: PestTreatmentReminder }
  | { type: 'savedReminder'; reminder: PestTreatmentReminder };

export function initialScheduleState(farmId: string | undefined, plotId: string | undefined): ScheduleState {
  const initialDate = new Date(DEFAULT_SCHEDULE_YEAR, DEFAULT_SCHEDULE_MONTH, DEFAULT_SCHEDULE_DAY);
  return {
    resolvedFarmId: farmId ?? '',
    resolvedPlotId: plotId ?? '',
    contextLoading: true,
    contextError: null,
    activeTab: 'Upcoming',
    reminders: [],
    remindersLoading: false,
    remindersError: null,
    detections: [],
    isAddModalOpen: false,
    linkedDetectionId: null,
    isDetectionPickerOpen: false,
    treatmentName: '',
    scheduledDate: formatDisplayDate(initialDate),
    repeatOption: 'WEEKLY',
    isRepeatPickerOpen: false,
    notes: '',
    saving: false,
    saveError: null,
    isCalendarOpen: false,
    calDate: initialDate,
    calYear: DEFAULT_SCHEDULE_YEAR,
    calMonth: DEFAULT_SCHEDULE_MONTH,
    isYearPickerOpen: false,
  };
}

export function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'prevMonth':
      return state.calMonth === 0
        ? { ...state, calMonth: 11, calYear: state.calYear - 1 }
        : { ...state, calMonth: state.calMonth - 1 };
    case 'nextMonth':
      return state.calMonth === 11
        ? { ...state, calMonth: 0, calYear: state.calYear + 1 }
        : { ...state, calMonth: state.calMonth + 1 };
    case 'replaceReminder':
      return {
        ...state,
        reminders: state.reminders.map((r) => (r.id === action.reminder.id ? action.reminder : r)),
      };
    case 'savedReminder':
      return {
        ...state,
        reminders: [action.reminder, ...state.reminders],
        isAddModalOpen: false,
        treatmentName: '',
        notes: '',
        linkedDetectionId: null,
        activeTab: 'Upcoming',
      };
  }
}
