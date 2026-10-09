// Warehouse returns (RMA) screens (design module M10), shared by the Main and Sub
// warehouse admins. Explicit exports only (no `export *`).
export { ApproveReturnScreen, type ApproveReturnScreenProps } from './ApproveReturnScreen';
export { InspectProductScreen, type InspectProductScreenProps } from './InspectProductScreen';
export { RefundCompletedScreen, type RefundCompletedScreenProps } from './RefundCompletedScreen';
export { RefundFailedScreen, type RefundFailedScreenProps } from './RefundFailedScreen';
export { RefundStatusScreen, type RefundStatusScreenProps } from './RefundStatusScreen';
export { RejectReturnRequestScreen, type RejectReturnRequestScreenProps } from './RejectReturnRequestScreen';
export { RequestRejectedScreen, type RequestRejectedScreenProps } from './RequestRejectedScreen';
export { ReturnApprovedScreen, type ReturnApprovedScreenProps } from './ReturnApprovedScreen';
export { ReturnHistoryDetailScreen, type ReturnHistoryDetailScreenProps } from './ReturnHistoryDetailScreen';
export { ReturnHistoryScreen, type ReturnHistoryScreenProps } from './ReturnHistoryScreen';
export { ReturnsIssuesScreen, type ReturnsIssuesScreenProps } from './ReturnsIssuesScreen';
export { ReviewReturnRequestScreen, type ReviewReturnRequestScreenProps } from './ReviewReturnRequestScreen';
export { RmaDetailScreen, type RmaDetailScreenProps } from './RmaDetailScreen';
export { ReturnsFlow, type ReturnsFlowProps, type ReturnsStackEntry } from './ReturnsFlow';
export { INITIAL_RETURN_HISTORY, INITIAL_RMA_ITEMS } from './fixtures';
export type {
  InspectionCondition,
  InspectionResultData,
  InspectStep,
  ReturnHistoryRecord,
  ReturnsRoute,
  ReturnsRouteParams,
  ReturnTimelineItem,
  RmaIssueCategory,
  RmaRecord,
  RmaScreenBaseProps,
  RmaStatus,
} from './types';
