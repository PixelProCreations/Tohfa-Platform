// Warehouse goods receiving & QC screens (design module M2), shared by the Main
// and Sub warehouse admins. Explicit exports only (no `export *`).
export { GoodsReceivingWizardScreen, type GoodsReceivingWizardScreenProps } from './GoodsReceivingWizardScreen';
export { ReceivingHistoryDetailScreen, type ReceivingHistoryDetailScreenProps } from './ReceivingHistoryDetailScreen';
export { RECEIVING_CODES } from './ReceivingParts';
export {
  ALERT_RECEIPT_ID,
  DEMO_SHIPMENT,
  RECEIVING_RECORDS,
  findReceivingRecord,
  recordsInScope,
} from './fixtures';
export type {
  QcResult,
  ReceiptResult,
  ReceiptTimelineEvent,
  ReceivingOutcome,
  ReceivingRecord,
  ReceivingWizardStep,
  ShipmentLineItem,
  StorageBayOption,
  WizardShipmentData,
} from './types';
