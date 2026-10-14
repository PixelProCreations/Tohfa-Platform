// Shared Main/Sub warehouse notifications & alerts screens (design module M13
// + M1-S06). Explicit exports only (no `export *`), mirroring the other area
// barrels so type names can never clash across barrels.
export { NotificationsScreen, type NotificationsScreenProps } from './NotificationsScreen';
export { NotificationDetailScreen, type NotificationDetailScreenProps } from './NotificationDetailScreen';
export { ApprovalAlertsScreen, type ApprovalAlertsScreenProps } from './ApprovalAlertsScreen';
export { NotificationsFlow, type NotificationsFlowProps, type NotificationsStackEntry } from './NotificationsFlow';
export { DEFAULT_TAG, NOTIFICATION_CODES, canOpenAlertRecord, canOpenTarget, tagOf } from './NotificationParts';
export { useUnreadNotificationCount } from './useNotificationsData';
export type {
  AlertRecordTarget,
  ApprovalAlertItem,
  NotificationCategory,
  NotificationFilter,
  NotificationItem,
  NotificationsRoute,
  NotificationsRouteParams,
  NotificationTagTone,
  NotificationTarget,
} from './types';
