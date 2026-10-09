// Shared Main/Sub warehouse notifications & alerts screens (design module M13
// + M1-S06). Explicit exports only (no `export *`), mirroring the other area
// barrels so type names can never clash across barrels.
export { NotificationsScreen, type NotificationsScreenProps } from './NotificationsScreen';
export { NotificationDetailScreen, type NotificationDetailScreenProps } from './NotificationDetailScreen';
export { ApprovalAlertsScreen, type ApprovalAlertsScreenProps } from './ApprovalAlertsScreen';
export { NotificationsFlow, type NotificationsFlowProps, type NotificationsStackEntry } from './NotificationsFlow';
export { NOTIFICATION_CODES, canOpenAlertRecord, canOpenTarget } from './NotificationParts';
export {
  APPROVAL_ALERTS,
  MAIN_NOTIFICATIONS,
  NOTIFICATION_WAREHOUSES,
  SUB_NOTIFICATIONS,
  defaultNotifications,
} from './fixtures';
export type {
  AlertRecordTarget,
  ApprovalAlertItem,
  NotificationCategory,
  NotificationFilter,
  NotificationItem,
  NotificationsRoute,
  NotificationsRouteParams,
  NotificationTarget,
} from './types';
