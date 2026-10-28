// Warehouse goods receiving & QC screens (design module M2), shared by the Main
// and Sub warehouse admins. Explicit exports only (no `export *`).
export { GoodsReceivingWizardScreen, type GoodsReceivingWizardScreenProps } from './GoodsReceivingWizardScreen';
export {
  IncomingShipmentsScreen,
  PendingQueueScreen,
  ReceivingActivityScreen,
  type IncomingShipmentsScreenProps,
  type PendingQueueScreenProps,
  type ReceivingActivityScreenProps,
} from './IncomingShipmentsScreen';
export { QualityIssuesScreen, type QualityIssuesScreenProps } from './QualityIssuesScreen';
export { ReceivingDashboardScreen, type ReceivingDashboardScreenProps } from './ReceivingDashboardScreen';
export {
  ReceivingFlow,
  canOpenReceivingRoute,
  receivingRouteFor,
  type ReceivingFlowProps,
} from './ReceivingFlow';
export { ReceivingHistoryDetailScreen, type ReceivingHistoryDetailScreenProps } from './ReceivingHistoryDetailScreen';
export { ReceivingHistoryScreen, type ReceivingHistoryScreenProps } from './ReceivingHistoryScreen';
export { ReceivingSearchFiltersScreen, type ReceivingSearchFiltersScreenProps } from './ReceivingSearchFiltersScreen';
export { ShipmentDetailScreen, type ShipmentDetailScreenProps } from './ShipmentDetailScreen';
export { RECEIVING_CODES } from './ReceivingParts';
// LEGACY sample data still imported by host code outside this area (see ./fixtures.ts).
export { ALERT_RECEIPT_ID, DEMO_SHIPMENT, findShipment, shipmentsInScope } from './fixtures';
export type {
  HistoryFilter,
  IncomingShipment,
  QcResult,
  ReceiptResult,
  ReceiptTimelineEvent,
  ReceivingOutcome,
  ReceivingRecord,
  ReceivingRoute,
  ReceivingRouteParams,
  ReceivingWizardStep,
  ShipmentFilterTab,
  ShipmentLineItem,
  ShipmentStatus,
  ShipmentType,
  StorageBayOption,
  WizardShipmentData,
} from './types';
