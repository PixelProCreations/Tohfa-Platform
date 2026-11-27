/**
 * UI string catalogue for the Farmer Applications list (design SA-M3-S016).
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console
 * has no i18n framework yet, so — like the other modules — this catalogue is the single
 * source of truth until one exists.
 */
export const FARMER_APPLICATIONS_LIST_STRINGS = {
  TITLE: 'Farmers Management',
  BREADCRUMB_DASHBOARD: 'Dashboard',
  BREADCRUMB_MODULE: 'Farmers Management',
  BREADCRUMB_CURRENT: 'Farmer Applications',

  BTN_EXPORT: 'Export',
  NOT_AVAILABLE_YET: 'Not available yet',

  KPI_TOTAL: 'Total Applications',
  KPI_PENDING_REVIEW: 'Pending Review',
  KPI_REQUEST_DOCUMENT: 'Request Document',
  KPI_APPROVED: 'Approved',
  KPI_AUDIT_SCHEDULED: 'Audit Scheduled',
  KPI_REJECTED: 'Rejected',

  SEARCH_PLACEHOLDER: 'Search by name, Application ID or mobile number',
  FILTER_APPLICATION_STATUS: 'Application Status:',
  FILTER_DOCUMENT_STATUS: 'Document Status:',
  FILTER_ZONE: 'Zone:',
  FILTER_ALL: 'All',
  BTN_RESET: 'Reset',

  COL_APPLICATION_ID: 'Application ID',
  COL_APPLICANT_NAME: 'Applicant Name',
  COL_MOBILE: 'Mobile Number',
  COL_ZONE: 'Zone',
  COL_FARMING_METHOD: 'Farming Method',
  COL_SUBMITTED: 'Submitted Date',
  COL_DOCUMENT_STATUS: 'Document Status',
  COL_APPLICATION_STATUS: 'Application Status',
  COL_ACTIONS: 'Actions',

  DOC_COMPLETE: 'Complete',
  DOC_INCOMPLETE: 'Incomplete',

  STATUS_PENDING_REVIEW: 'Pending Review',
  STATUS_REQUEST_DOCUMENT: 'Request Document',
  STATUS_APPROVED: 'Approved',
  STATUS_AUDIT_SCHEDULED: 'Audit Scheduled',
  STATUS_AUDIT_IN_PROGRESS: 'Audit In Progress',
  STATUS_AUDIT_COMPLETED: 'Audit Completed',
  STATUS_FINAL_APPROVED: 'Final Approved',
  STATUS_REJECTED: 'Rejected',
  STATUS_ON_HOLD: 'On Hold',

  ACTION_REVIEW: 'Review',

  WORKFLOW_TITLE: 'Application Status – Workflow',
  WORKFLOW_INFO: 'How an application moves from submission to a decision',
  WF_PENDING_REVIEW: 'Pending Review',
  WF_PENDING_REVIEW_DESC: 'New application',
  WF_REQUEST_DOCUMENT: 'Request Document',
  WF_REQUEST_DOCUMENT_DESC: 'Farmer to upload/clarify',
  WF_APPROVED: 'Approved',
  WF_APPROVED_DESC: 'Approved, schedule audit',
  WF_AUDIT_SCHEDULED: 'Audit Scheduled',
  WF_AUDIT_SCHEDULED_DESC: 'Audit date & auditor assigned',
  WF_AUDIT_IN_PROGRESS: 'Audit In Progress',
  WF_AUDIT_IN_PROGRESS_DESC: 'Audit being conducted',
  WF_AUDIT_COMPLETED: 'Audit Completed',
  WF_AUDIT_COMPLETED_DESC: 'Audit finished',
  WF_FINAL_APPROVED: 'Final Approved',
  WF_FINAL_APPROVED_DESC: 'Fully verified & active',
  WF_REJECTED: 'Rejected',
  WF_REJECTED_DESC: 'Application not approved',

  EMPTY: 'No farmer applications match the selected filters.',
  EMPTY_DEMO_PAGE: 'No applications on this page in the demo data',
  PREV: 'Prev',
  NEXT: 'Next',
  showing: (first: number, last: number, total: number): string => `Showing ${first}–${last} of ${total} applications`,
  showingMatching: (shown: number, matching: number): string => `Showing ${shown} of ${matching} matching applications`,
} as const;
