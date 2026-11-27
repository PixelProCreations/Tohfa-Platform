/**
 * UI string catalogue for Audit Management → dashboard (design 74). Shared audit strings (statuses,
 * types, months) live in audit.strings.ts. Per root CLAUDE.md §2.7 strings do not live in components.
 */
export const AUDIT_DASHBOARD_STRINGS = {
  TITLE: 'Audit Management',
  SUBTITLE: 'TOHFA Admin · All zones',

  ACTION_SEARCH: 'Search audits',
  ACTION_NOTIFICATIONS: 'Notifications',
  notificationsLabel: (n: number): string => `Notifications, ${n} unread`,
  ACTION_REFRESH: 'Refresh',

  KPI_REGION: 'Audit summary',
  KPI_UPCOMING: 'Upcoming Audits',
  KPI_IN_PROGRESS: 'Audits In Progress',
  KPI_PENDING_REVIEW: 'Pending Review',
  KPI_COMPLETED: 'Completed Audits',
  KPI_CORRECTIVE_ACTIONS: 'Corrective Actions (open)',
  KPI_COMPLIANCE_ALERTS: 'Compliance Alerts',

  CALENDAR_REGION: 'Audit calendar',
  PREV_MONTH: 'Previous month',
  NEXT_MONTH: 'Next month',
  dayLabel: (longDate: string, count: number, selected: boolean): string =>
    `${longDate}, ${count === 0 ? 'no audits' : `${count} audit${count === 1 ? '' : 's'}`}${
      selected ? ', selected' : ''
    }`,
  LEGEND_LABEL: 'Legend',
  LEGEND_SCHEDULED: 'Scheduled',
  LEGEND_IN_PROGRESS: 'In progress',
  LEGEND_REVIEW: 'Pending review / upcoming',
  LEGEND_OVERDUE: 'Overdue',
  LEGEND_COMPLETED: 'Completed',

  COL_INDEX: '#',
  COL_AUDIT_ID: 'Audit ID',
  COL_FARMER_FARM: 'Farmer / Farm',
  COL_ZONE: 'Zone',
  COL_TYPE: 'Audit Type',
  COL_SCHEDULED: 'Scheduled Date & Time',
  COL_AUDITOR: 'Assigned Auditor',
  COL_STATUS: 'Status',
  COL_ACTIONS: 'Actions',
  farmerWithCode: (name: string, code: string): string => `${name} (${code})`,
  ACTION_VIEW: 'View',
  ACTION_RESCHEDULE: 'Reschedule',
  viewAudit: (id: string): string => `View audit ${id}`,
  rescheduleAudit: (id: string): string => `Reschedule audit ${id} (not available yet)`,
  DAY_EMPTY: 'No audits scheduled for this day.',
  DAY_EMPTY_HINT: 'Pick another date on the calendar.',

  QUICK_ACTIONS: 'Quick actions',
  QA_SCHEDULE: 'View Audit Schedule',
  QA_HISTORY: 'View Audit History',
  QA_REPORT: 'Generate Audit Report',
  QA_REPORT_HISTORY: 'Report History',
} as const;
