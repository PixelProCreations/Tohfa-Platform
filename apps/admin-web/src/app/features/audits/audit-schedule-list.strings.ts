/**
 * UI string catalogue for Audit Management → Audit Schedule & Assignment (design 75). Shared audit
 * strings (statuses, types, months) live in audit.strings.ts. Per root CLAUDE.md §2.7 strings do not
 * live in components.
 */
export const AUDIT_SCHEDULE_LIST_STRINGS = {
  TITLE: 'Audit Schedule & Assignment',
  SUBTITLE: 'Manage scheduled, ongoing, completed and overdue farm audits',

  KPI_REGION: 'Schedule summary',
  KPI_TOTAL: 'Total Schedules',
  KPI_SCHEDULED: 'Scheduled',
  KPI_IN_PROGRESS: 'In Progress',
  KPI_PENDING_REVIEW: 'Pending Review',
  KPI_COMPLETED: 'Completed',
  KPI_OVERDUE: 'Overdue',

  FILTERS_REGION: 'Filter audit schedules',
  SEARCH_LABEL: 'Search audit schedules',
  SEARCH_PLACEHOLDER: 'Search audit ID, farmer, farm or auditor',
  FILTER_ZONE: 'Zone:',
  FILTER_TYPE: 'Audit Type:',
  FILTER_AUDITOR: 'Auditor:',
  FILTER_STATUS: 'Status:',
  FILTER_ALL: 'All',
  DATE_RANGE: 'Date Range',
  dateRangeActive: (from: string, to: string): string => `${from} – ${to}`,
  DATE_FROM: 'From',
  DATE_TO: 'To',
  DATE_ANY: 'Any',
  DATE_CLEAR: 'Clear',
  DATE_DONE: 'Done',
  DATE_RANGE_DIALOG: 'Scheduled date range',
  BTN_EXPORT: 'Export',
  EXPORT_INERT: 'Not available yet — no export format has been designed',

  COL_INDEX: '#',
  COL_AUDIT_ID: 'Audit ID',
  COL_FARMER_FARM: 'Farmer / Farm',
  COL_ZONE: 'Zone',
  COL_TYPE: 'Audit Type',
  COL_SCHEDULED: 'Scheduled Date & Time',
  COL_AUDITOR: 'Assigned Auditor',
  COL_STATUS: 'Status',
  COL_UPDATED: 'Last Updated',
  COL_ACTIONS: 'Actions',
  farmerFarm: (farmer: string, farm: string): string => `${farmer} · ${farm}`,

  ACTION_VIEW: 'View',
  ACTION_UPDATE: 'Update',
  ACTION_RESCHEDULE: 'Reschedule',
  ACTION_CANCEL: 'Cancel',
  ACTION_REVIEW: 'Review',
  actionAria: (action: string, id: string): string => `${action} audit ${id}`,
  actionInertAria: (action: string, id: string): string =>
    `${action} audit ${id} (not available yet)`,

  EMPTY: 'No audit schedules match the selected filters.',
  PREV: 'Previous',
  NEXT: 'Next',
  showing: (first: number, last: number, total: number): string =>
    `Showing ${first}–${last} of ${total} schedule${total === 1 ? '' : 's'}`,
  resultCount: (n: number): string => `${n} schedule${n === 1 ? '' : 's'} found`,
} as const;
