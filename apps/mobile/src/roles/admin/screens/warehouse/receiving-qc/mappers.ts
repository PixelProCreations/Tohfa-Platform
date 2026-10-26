/**
 * API rows -> the receiving screens' live types (./liveTypes.ts), and the
 * wizard's drafts -> request bodies (goods receipt, quality check,
 * counter-offer). Pure, so plain-Node vitest covers every branch
 * (../../../tests/receiving_mappers.test.ts).
 *
 * Every weight is integer grams: the API's kg strings are read as text
 * (parseKgToGrams) and written back with gramsToKgString, never through
 * parseFloat. Money stays the API's string. What the API does not carry is
 * left null / undefined so the screen hides it, never a sample or a 0.
 *
 * Statuses go through exhaustive tables with a fallback for a value the app
 * does not know yet. The server never advances a purchase order past ISSUED
 * on its own, so a shipment's receiving progress is derived from its receipts
 * when they are known (shipmentStatusOf).
 */
import { fromPaise } from '@tohfa/shared-types';
import { bodyFingerprint } from '../../../api/hookHelpers';
import type { Grade } from '../../../api/inventory';
import type {
  CounterOfferCreate,
  GoodsReceiptCreate,
  GoodsReceiptDetailDto,
  GoodsReceiptDiscrepancyCreate,
  GoodsReceiptDiscrepancyDto,
  GoodsReceiptDiscrepancyType,
  GoodsReceiptDto,
  GoodsReceiptPackageUnit,
  GoodsReceiptStatus,
  PurchaseOrderDetailDto,
  PurchaseOrderDto,
  PurchaseOrderStatus,
  QcConditionLevel,
  QcRejectionReasonCode,
  QualityCheckCreate,
  QualityCheckDto,
  QualityCheckItem,
  QualityCheckParameter,
  QualityOutcome,
} from '../../../api/receiving';
import type { StorageLocationDto } from '../../../api/warehouses';
import type { TransferStatus, WarehouseTransferDto } from '../../../api/warehouseTransfers';
import { t, type TranslationKey } from '../../../i18n';
import { parseRupeesToPaise } from '../../../money/paise';
import { formatKgNumber, gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate, formatAdminDay, istDay } from '../../../utils/datetime';
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import { createIdempotencyKeyCache, newIdempotencyKey } from '../../../../../shell/api/idempotency';
import type {
  LiveDiscrepancy,
  LivePackages,
  LiveQcPoint,
  LiveQcResult,
  LiveQualityCheck,
  LiveQualityIssue,
  LiveReceipt,
  LiveReceiptDetail,
  LiveReceiptResult,
  LiveReceivingFilters,
  LiveResultFilter,
  LiveShipment,
  LiveShipmentStatus,
  LiveStorageOption,
  QcCriterionId,
} from './liveTypes';
import type { WarehouseScope } from './types';

function has<K extends string>(table: Record<K, unknown>, value: string): value is K {
  return Object.prototype.hasOwnProperty.call(table, value);
}

/** A Quantity string as grams; null for an absent value or one that is not a Quantity. */
export function grams(value: string | null | undefined): number | null {
  return typeof value === 'string' ? parseKgToGrams(value) : null;
}

/** Sum of grams; null when any part is unknown. */
function sumGrams(values: readonly (number | null)[]): number | null {
  let total = 0;
  for (const value of values) {
    if (value === null) return null;
    total += value;
  }
  return total;
}

export function text(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

// ─── Labels ──────────────────────────────────────────────────────────────────

/** "480 KG": the unit as the receiving screens already write it, from integer grams. */
export function kgLabel(value: number): string {
  return t('receiving.qty.kg', { value: formatKgNumber(value) });
}

/** A grade's label, '' when there is none. */
export function gradeLabel(grade: Grade | undefined | null): string {
  if (grade === undefined || grade === null) return '';
  return has(GRADE_KEYS, grade) ? t(GRADE_KEYS[grade]) : t('inventory.grade.unknown');
}

const GRADE_KEYS: Record<Grade, TranslationKey> = {
  GRADE_1: 'inventory.grade.GRADE_1',
  GRADE_2: 'inventory.grade.GRADE_2',
  GRADE_3: 'inventory.grade.GRADE_3',
  REJECT: 'inventory.grade.REJECT',
};

/** The grades a quality check may assign (docs/openapi.yaml Grade). */
export const GRADES: readonly Grade[] = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'];

/** docs/openapi.yaml QcConditionLevel, best to worst (UNCONFIRMED set; reference values, not thresholds). */
export const QC_CONDITION_LEVELS: readonly QcConditionLevel[] = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNACCEPTABLE'];

const CONDITION_KEYS: Record<QcConditionLevel, TranslationKey> = {
  EXCELLENT: 'receiving.condition.EXCELLENT',
  GOOD: 'receiving.condition.GOOD',
  FAIR: 'receiving.condition.FAIR',
  POOR: 'receiving.condition.POOR',
  UNACCEPTABLE: 'receiving.condition.UNACCEPTABLE',
};

export function conditionLabel(level: QcConditionLevel): string {
  return t(CONDITION_KEYS[level]);
}

/** docs/openapi.yaml QcRejectionReasonCode (UNCONFIRMED set). */
export const QC_REJECTION_REASON_CODES: readonly QcRejectionReasonCode[] = [
  'BELOW_GRADE',
  'PHYSICAL_DAMAGE',
  'SPOILAGE',
  'PEST_OR_DISEASE',
  'MOISTURE_OUT_OF_RANGE',
  'FOREIGN_MATTER',
  'WRONG_CROP',
  'OTHER',
];

const REASON_KEYS: Record<QcRejectionReasonCode, TranslationKey> = {
  BELOW_GRADE: 'receiving.rejectionReason.BELOW_GRADE',
  PHYSICAL_DAMAGE: 'receiving.rejectionReason.PHYSICAL_DAMAGE',
  SPOILAGE: 'receiving.rejectionReason.SPOILAGE',
  PEST_OR_DISEASE: 'receiving.rejectionReason.PEST_OR_DISEASE',
  MOISTURE_OUT_OF_RANGE: 'receiving.rejectionReason.MOISTURE_OUT_OF_RANGE',
  FOREIGN_MATTER: 'receiving.rejectionReason.FOREIGN_MATTER',
  WRONG_CROP: 'receiving.rejectionReason.WRONG_CROP',
  OTHER: 'receiving.rejectionReason.OTHER',
};

export function rejectionReasonLabel(code: QcRejectionReasonCode): string {
  return t(REASON_KEYS[code]);
}

/** docs/openapi.yaml GoodsReceiptPackageUnit (BR-123, UNCONFIRMED set). */
export const PACKAGE_UNITS: readonly GoodsReceiptPackageUnit[] = ['CRATE', 'BAG', 'SACK', 'BOX', 'BUNDLE', 'TRAY', 'OTHER'];

const PACKAGE_KEYS: Record<GoodsReceiptPackageUnit, TranslationKey> = {
  CRATE: 'receiving.packageUnit.CRATE',
  BAG: 'receiving.packageUnit.BAG',
  SACK: 'receiving.packageUnit.SACK',
  BOX: 'receiving.packageUnit.BOX',
  BUNDLE: 'receiving.packageUnit.BUNDLE',
  TRAY: 'receiving.packageUnit.TRAY',
  OTHER: 'receiving.packageUnit.OTHER',
};

export function packageUnitLabel(unit: GoodsReceiptPackageUnit): string {
  return t(PACKAGE_KEYS[unit]);
}

/** BR-123: "12 crates"; undefined when no count was recorded. */
export function packagesOf(count: number | null | undefined, unit: GoodsReceiptPackageUnit | null | undefined): LivePackages | undefined {
  if (typeof count !== 'number' || count < 1 || unit === null || unit === undefined || !has(PACKAGE_KEYS, unit)) return undefined;
  return { count, unit, label: t('receiving.packages', { count, unit: packageUnitLabel(unit) }) };
}

const DISCREPANCY_TYPE_KEYS: Record<GoodsReceiptDiscrepancyType, TranslationKey> = {
  QUANTITY: 'receiving.discrepancyType.QUANTITY',
  QUALITY: 'receiving.discrepancyType.QUALITY',
  CROP_MISMATCH: 'receiving.discrepancyType.CROP_MISMATCH',
  DAMAGE: 'receiving.discrepancyType.DAMAGE',
  OTHER: 'receiving.discrepancyType.OTHER',
};

export function discrepancyTypeLabel(type: string): string {
  return has(DISCREPANCY_TYPE_KEYS, type) ? t(DISCREPANCY_TYPE_KEYS[type]) : t('receiving.discrepancyType.OTHER');
}

const OUTCOME_KEYS: Record<QualityOutcome, TranslationKey> = {
  ACCEPTED: 'receiving.receiptResult.accepted',
  PARTIALLY_ACCEPTED: 'receiving.receiptResult.partiallyAccepted',
  REJECTED: 'receiving.receiptResult.rejected',
};

// ─── Scope ───────────────────────────────────────────────────────────────────

/** Main Warehouse view: no warehouseId means every warehouse. */
export function isMainScope(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/**
 * The warehouseId a receiving request sends (BR-30). A Sub scope always sends
 * its own warehouse uuid, whatever a picker says; the Main view sends the
 * warehouse it picked, or nothing for all of them.
 */
export function receivingWarehouseFilter(scope: WarehouseScope, selectedId: string | undefined): string | undefined {
  return scope.warehouseId !== undefined ? scope.warehouseId : selectedId;
}

/** Where a row's warehouse name comes from: a Sub scope's own, or the Main view's GET /warehouses list. */
export interface WarehouseNaming {
  warehouseName?: string | undefined;
  warehouseNames?: ReadonlyMap<string, string> | undefined;
}

export function warehouseNameFor(warehouseId: string, naming: WarehouseNaming): string | undefined {
  return naming.warehouseName ?? naming.warehouseNames?.get(warehouseId);
}

// ─── Statuses ────────────────────────────────────────────────────────────────

const PO_STATUS: Record<PurchaseOrderStatus, LiveShipmentStatus> = {
  ISSUED: 'Expected',
  PARTIALLY_RECEIVED: 'Receiving',
  RECEIVED: 'Completed',
  CANCELLED: 'Cancelled',
};

const SHIPMENT_STATUS_LABEL: Record<LiveShipmentStatus, TranslationKey> = {
  Expected: 'receiving.shipmentStatus.expected',
  'Awaiting QC': 'receiving.shipmentStatus.awaitingQc',
  Receiving: 'receiving.shipmentStatus.receiving',
  Completed: 'receiving.shipmentStatus.completed',
  Rejected: 'receiving.shipmentStatus.rejected',
  Cancelled: 'receiving.shipmentStatus.cancelled',
  Unknown: 'receiving.shipmentStatus.unknown',
};

/**
 * A purchase order's receiving status. With its receipts known: a receipt
 * awaiting QC wins (resume it, do not receive again); every receipt rejected
 * is Rejected; then the gross received against the ordered quantity. Without
 * the receipts, the order's own status.
 */
export function shipmentStatusOf(
  po: Pick<PurchaseOrderDto, 'status' | 'quantityKg'>,
  receipts?: readonly GoodsReceiptDto[] | undefined,
): LiveShipmentStatus {
  const own: LiveShipmentStatus = has(PO_STATUS, po.status) ? PO_STATUS[po.status] : 'Unknown';
  if (own === 'Cancelled' || own === 'Unknown' || receipts === undefined) return own;
  if (receipts.some((r) => r.status === 'AWAITING_QC')) return 'Awaiting QC';
  if (receipts.length > 0 && receipts.every((r) => r.status === 'REJECTED')) return 'Rejected';
  if (own === 'Completed' || receipts.length === 0) return own;
  const received = sumGrams(receipts.map((r) => grams(r.grossQtyKg)));
  const ordered = grams(po.quantityKg);
  if (received !== null && ordered !== null && received >= ordered) return 'Completed';
  return 'Receiving';
}

export function shipmentStatusLabel(status: LiveShipmentStatus): string {
  return t(SHIPMENT_STATUS_LABEL[status]);
}

/** True when a new receipt may be started on an order in this status. */
export function isReceivable(status: LiveShipmentStatus): boolean {
  return status === 'Expected' || status === 'Receiving';
}

/**
 * True when a shipment shows under an Incoming Shipments pill. There is no
 * arrival status (owner decision), so "Arrived" lists what was recorded at
 * the gate and still awaits its quality check; "Receiving" also lists those.
 */
export function matchesShipmentTab(status: LiveShipmentStatus, tab: string): boolean {
  switch (tab) {
    case 'Expected':
      return status === 'Expected';
    case 'Arrived':
    case 'QC Pending':
      return status === 'Awaiting QC';
    case 'Receiving':
    case 'In Progress':
      return status === 'Receiving' || status === 'Awaiting QC';
    case 'Completed':
      return status === 'Completed';
    case 'Rejected':
      return status === 'Rejected';
    default:
      return true;
  }
}

const RECEIPT_RESULT: Record<GoodsReceiptStatus, Exclude<LiveReceiptResult, 'Unknown'>> = {
  AWAITING_QC: 'Awaiting QC',
  ACCEPTED: 'Accepted',
  PARTIALLY_ACCEPTED: 'Partially Accepted',
  REJECTED: 'Rejected',
  COUNTER_OFFERED: 'Counter-Offered',
};

const RECEIPT_RESULT_LABEL: Record<LiveReceiptResult, TranslationKey> = {
  'Awaiting QC': 'receiving.receiptResult.awaitingQc',
  Accepted: 'receiving.receiptResult.accepted',
  'Partially Accepted': 'receiving.receiptResult.partiallyAccepted',
  Rejected: 'receiving.receiptResult.rejected',
  'Counter-Offered': 'receiving.receiptResult.counterOffered',
  Unknown: 'receiving.receiptResult.unknown',
};

export function receiptResultOf(status: string): LiveReceiptResult {
  return has(RECEIPT_RESULT, status) ? RECEIPT_RESULT[status] : 'Unknown';
}

export function receiptResultLabel(result: LiveReceiptResult): string {
  return t(RECEIPT_RESULT_LABEL[result]);
}

/** The server status a Receiving History result pill filters on (undefined = all). */
export const HISTORY_RESULT_STATUS = {
  All: undefined,
  'Awaiting QC': 'AWAITING_QC',
  Accepted: 'ACCEPTED',
  Partial: 'PARTIALLY_ACCEPTED',
  Rejected: 'REJECTED',
} as const satisfies Record<LiveResultFilter, GoodsReceiptStatus | undefined>;

// ─── Rows ────────────────────────────────────────────────────────────────────

/** The crop name the API sent, else a label naming the order. Never "Unnamed crop" and never a guess. */
export function receivingCropLabel(cropName: string | null | undefined, ref: string): string {
  return text(cropName) ?? t('receiving.crop.ofOrder', { ref });
}

/** The newest receipt still awaiting its quality check. */
export function pendingReceiptOf(receipts: readonly GoodsReceiptDto[]): GoodsReceiptDto | undefined {
  let newest: GoodsReceiptDto | undefined;
  for (const receipt of receipts) {
    if (receipt.status !== 'AWAITING_QC') continue;
    if (newest === undefined || receipt.receivedAt > newest.receivedAt) newest = receipt;
  }
  return newest;
}

function newestReceipt(receipts: readonly GoodsReceiptDto[]): GoodsReceiptDto | undefined {
  return receipts.reduce<GoodsReceiptDto | undefined>((n, r) => (n === undefined || r.receivedAt > n.receivedAt ? r : n), undefined);
}

export interface ShipmentContext extends WarehouseNaming {
  /** The order's receipts, when known (the detail carries them). */
  receipts?: readonly GoodsReceiptDto[] | undefined;
}

/** A purchase order (list row or detail) as the shipment the screens show. */
export function toPurchaseOrderShipment(po: PurchaseOrderDto | PurchaseOrderDetailDto, ctx: ShipmentContext): LiveShipment {
  const detail = po as PurchaseOrderDetailDto;
  const receipts = ctx.receipts;
  const status = shipmentStatusOf(po, receipts);
  const cropName = text(po.cropName) ?? text(receipts?.find((r) => text(r.cropName) !== undefined)?.cropName);
  const checked = receipts?.filter((r) => r.status !== 'AWAITING_QC') ?? [];
  const newest = receipts === undefined ? undefined : newestReceipt(receipts.filter((r) => typeof r.packageCount === 'number'));
  const first = receipts?.reduce<string | undefined>((f, r) => (f === undefined || r.receivedAt < f ? r.receivedAt : f), undefined);
  return {
    kind: 'purchaseOrder',
    id: po.id,
    code: po.poNumber,
    type: 'Farmer/Admin',
    status,
    statusLabel: shipmentStatusLabel(status),
    warehouseId: po.warehouseId,
    from: text(po.farmerName) ?? '',
    to: warehouseNameFor(po.warehouseId, ctx) ?? '',
    produce: receivingCropLabel(cropName, po.poNumber),
    cropName,
    grade: gradeLabel(po.grade),
    apiGrade: po.grade,
    cropId: text(po.cropId),
    expectedGrams: grams(po.quantityKg),
    receivedGrams: receipts === undefined ? null : sumGrams(receipts.map((r) => grams(r.grossQtyKg))),
    acceptedGrams: checked.length === 0 ? null : sumGrams(checked.map((r) => grams(r.acceptedQtyKg))),
    rejectedGrams: checked.length === 0 ? null : sumGrams(checked.map((r) => grams(r.rejectedQtyKg))),
    issuedAt: text(po.issuedAt),
    issuedOn: po.issuedAt === undefined ? '' : formatAdminDay(po.issuedAt),
    expectedArrival: typeof po.expectedDeliveryDate === 'string' ? formatAdminDay(po.expectedDeliveryDate) : '',
    expectedDeliveryDate: text(po.expectedDeliveryDate),
    firstReceivedAt: first,
    packages: newest === undefined ? undefined : packagesOf(newest.packageCount, newest.packageUnit),
    receiptIds: receipts?.map((r) => r.id) ?? [],
    pendingReceiptId: receipts === undefined ? undefined : pendingReceiptOf(receipts)?.id,
    farmerCode: text(detail.tohfaFarmerId) ?? '',
    pricePerKg: po.pricePerKg,
    totalAmount: po.totalAmount,
  };
}

const TRANSFER_STATUS: Record<TransferStatus, LiveShipmentStatus> = {
  PENDING_APPROVAL: 'Expected',
  IN_TRANSIT: 'Expected',
  RECEIVED: 'Completed',
  CANCELLED: 'Cancelled',
};

/**
 * An inbound inter-warehouse transfer as a shipment row. The list header
 * carries no lines, so its produce and weight are unknown here (the transfer
 * detail has them).
 */
export function toTransferShipment(transfer: WarehouseTransferDto, naming: WarehouseNaming): LiveShipment {
  const status: LiveShipmentStatus = has(TRANSFER_STATUS, transfer.status) ? TRANSFER_STATUS[transfer.status] : 'Unknown';
  const names = { warehouseNames: naming.warehouseNames };
  return {
    kind: 'transfer',
    id: transfer.id,
    code: transfer.transferNumber,
    type: 'Inter-Warehouse Transfer',
    status,
    statusLabel: shipmentStatusLabel(status),
    warehouseId: transfer.toWarehouseId,
    from: warehouseNameFor(transfer.fromWarehouseId, names) ?? '',
    to: warehouseNameFor(transfer.toWarehouseId, naming) ?? '',
    produce: '',
    grade: '',
    expectedGrams: null,
    receivedGrams: null,
    acceptedGrams: null,
    rejectedGrams: null,
    issuedAt: transfer.createdAt,
    issuedOn: formatAdminDay(transfer.createdAt),
    expectedArrival: '',
    firstReceivedAt: text(transfer.receivedAt),
    receiptIds: [],
    farmerCode: '',
  };
}

export interface RecordContext extends WarehouseNaming {
  /** Clock for "Today · 10:30 AM"; passed in so the mapper stays pure. */
  now: Date;
  expectedGrams?: number | null | undefined;
  /** The order's poNumber, when the row does not carry it (nested receipts). */
  poNumber?: string | undefined;
  /** The order's crop and grade, when the row does not carry them (nested receipts). */
  cropName?: string | null | undefined;
  grade?: Grade | undefined;
}

/** A goods receipt as Receiving History, its detail and the dashboards show it. */
export function toLiveReceipt(gr: GoodsReceiptDto, ctx: RecordContext): LiveReceipt {
  const result = receiptResultOf(gr.status);
  // Before the quality check the server sends 0.000 accepted: "not decided yet", not "nothing accepted".
  const checked = result !== 'Awaiting QC';
  const poNumber = text(gr.poNumber) ?? ctx.poNumber;
  const cropName = text(gr.cropName) ?? text(ctx.cropName);
  const grade = gr.grade ?? ctx.grade;
  return {
    id: gr.id,
    receiptId: gr.grnNumber,
    purchaseOrderId: gr.purchaseOrderId,
    shipmentId: poNumber ?? '',
    warehouseId: gr.warehouseId,
    warehouseName: warehouseNameFor(gr.warehouseId, ctx) ?? '',
    result,
    resultLabel: receiptResultLabel(result),
    receivedAt: gr.receivedAt,
    date: formatAdminDate(gr.receivedAt, ctx.now),
    day: formatAdminDay(gr.receivedAt),
    product: receivingCropLabel(cropName, poNumber ?? gr.grnNumber),
    cropName,
    grade: gradeLabel(grade),
    apiGrade: grade,
    expectedGrams: ctx.expectedGrams ?? null,
    receivedGrams: grams(gr.grossQtyKg),
    acceptedGrams: checked ? grams(gr.acceptedQtyKg) : null,
    rejectedGrams: checked ? grams(gr.rejectedQtyKg) : null,
    rejectionReason: text(gr.rejectionReason),
    vehicleNumber: text(gr.vehicleNumber),
    receivedBy: text(gr.receivedByName),
    batchId: text(gr.batchId),
    batchCode: text(gr.batchCode),
    packages: packagesOf(gr.packageCount, gr.packageUnit),
  };
}

/** The wizard's checklist rows, in order, and the parameter each one sends. */
export const QC_ORDER: readonly QcCriterionId[] = ['appearance', 'size', 'moisture', 'damage', 'freshness'];

export const QC_PARAMETER: Record<QcCriterionId, QualityCheckParameter> = {
  appearance: 'APPEARANCE',
  size: 'SIZE_UNIFORMITY',
  moisture: 'MOISTURE',
  damage: 'DAMAGE_PEST',
  freshness: 'FRESHNESS',
};

function qualityCheckOf(qc: QualityCheckDto): LiveQualityCheck {
  const points: LiveQcPoint[] = [];
  for (const id of QC_ORDER) {
    const item = qc.items?.find((i) => i.parameter === QC_PARAMETER[id]);
    if (item === undefined) continue;
    const condition = item.condition !== null && item.condition !== undefined && has(CONDITION_KEYS, item.condition) ? item.condition : undefined;
    points.push({
      criterionId: id,
      parameter: item.parameter,
      passed: item.passed,
      result: item.passed ? 'pass' : 'fail',
      condition,
      conditionLabel: condition === undefined ? undefined : conditionLabel(condition),
      score: typeof item.score === 'number' ? item.score : undefined,
      measuredValue: text(item.measuredValue),
      remarks: text(item.remarks),
    });
  }
  const code = qc.rejectionReasonCode !== null && qc.rejectionReasonCode !== undefined && has(REASON_KEYS, qc.rejectionReasonCode) ? qc.rejectionReasonCode : undefined;
  return {
    outcome: qc.outcome,
    outcomeLabel: has(OUTCOME_KEYS, qc.outcome) ? t(OUTCOME_KEYS[qc.outcome]) : receiptResultLabel('Unknown'),
    apiAssignedGrade: qc.assignedGrade,
    assignedGrade: gradeLabel(qc.assignedGrade),
    listedGrade: qc.listedGrade === undefined ? undefined : gradeLabel(qc.listedGrade),
    checkedBy: text(qc.checkedByName),
    checkedAt: qc.checkedAt,
    checkedOn: formatAdminDay(qc.checkedAt),
    points,
    passedPoints: points.filter((p) => p.passed).length,
    acceptedGrams: grams(qc.acceptedQtyKg),
    rejectedGrams: grams(qc.rejectedQtyKg),
    damagedGrams: grams(qc.damagedQtyKg),
    spoiledGrams: grams(qc.spoiledQtyKg),
    rejectionReasonCode: code,
    rejectionReasonLabel: code === undefined ? undefined : rejectionReasonLabel(code),
    actualCropName: text(qc.actualCropName),
    cropMismatchGrams: grams(qc.cropMismatchQtyKg),
    moisturePct: typeof qc.moisturePct === 'number' ? qc.moisturePct : undefined,
    visualScore: typeof qc.visualScore === 'number' ? qc.visualScore : undefined,
    defectNotes: text(qc.defectNotes),
  };
}

/** GET /admin/goods-receipts/{id}: the receipt with its quality check (BR-119, BR-120). */
export function toReceiptDetail(dto: GoodsReceiptDetailDto, ctx: RecordContext): LiveReceiptDetail {
  return { ...toLiveReceipt(dto, ctx), qualityCheck: dto.qualityCheck === null || dto.qualityCheck === undefined ? null : qualityCheckOf(dto.qualityCheck) };
}

/** A persisted damage / mismatch report (BR-121). */
export function toDiscrepancy(dto: GoodsReceiptDiscrepancyDto, now: Date): LiveDiscrepancy {
  return {
    id: dto.id,
    type: dto.type,
    typeLabel: discrepancyTypeLabel(dto.type),
    expected: dto.expected,
    actual: dto.actual,
    status: dto.status,
    statusLabel: t('receiving.discrepancyStatus.OPEN'),
    note: text(dto.note),
    createdBy: text(dto.createdByName),
    createdAt: dto.createdAt,
    createdOn: formatAdminDate(dto.createdAt, now),
  };
}

/** The receiving issues the API can back: receipts still awaiting their quality check. */
export function qcPendingIssues(records: readonly LiveReceipt[]): LiveQualityIssue[] {
  return records
    .filter((r) => r.result === 'Awaiting QC')
    .map((r) => ({
      id: r.id,
      purchaseOrderId: r.purchaseOrderId,
      kind: 'QC Pending' as const,
      shipmentCode: r.shipmentId !== '' ? r.shipmentId : r.receiptId,
      receiptCode: r.receiptId,
      produce: r.product,
      detail: r.receivedGrams === null ? t('receiving.issue.qcPendingNoQty') : t('receiving.issue.qcPending', { qty: kgLabel(r.receivedGrams) }),
      warehouseId: r.warehouseId,
      time: r.date,
    }));
}

/** A storage location as a putaway choice; the quality check sends its code. */
export function toStorageOption(loc: StorageLocationDto): LiveStorageOption {
  return {
    id: loc.id,
    code: loc.code,
    label: text(loc.name) ?? loc.code,
    zone: text(loc.locationType) ?? '',
    capacityGrams: grams(loc.capacityKg),
  };
}

// ─── Filters (BR-122) ────────────────────────────────────────────────────────

export const EMPTY_LIVE_FILTERS: LiveReceivingFilters = {
  search: '',
  date: 'All',
  customFrom: undefined,
  customTo: undefined,
  warehouseId: undefined,
  shipmentType: 'All',
  result: 'All',
};

/** The server's bound on `q`. */
const Q_MAX = 100;
/** "Last 7 Days" is today and the six IST days before it. */
const LAST_7_DAYS_BACK = 6;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRealDay(day: string | undefined): day is string {
  const m = day === undefined ? null : DAY_RE.exec(day);
  if (m === null) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

export interface IntakeFilterParams {
  q?: string;
  from?: string;
  to?: string;
}

/** `q`, `from`, `to` for the purchase-order and goods-receipt lists (IST days). */
export function intakeFilterParams(filters: LiveReceivingFilters, now: Date): IntakeFilterParams {
  const out: IntakeFilterParams = {};
  const q = filters.search.trim().slice(0, Q_MAX);
  if (q !== '') out.q = q;
  if (filters.date === 'Today') {
    const today = istDay(now);
    out.from = today;
    out.to = today;
  } else if (filters.date === 'Last 7 Days') {
    out.from = istDay(new Date(now.getTime() - LAST_7_DAYS_BACK * DAY_MS));
    out.to = istDay(now);
  } else if (filters.date === 'Custom') {
    const from = isRealDay(filters.customFrom) ? filters.customFrom : undefined;
    const to = isRealDay(filters.customTo) ? filters.customTo : undefined;
    if (from !== undefined && to !== undefined && from > to) return out;
    if (from !== undefined) out.from = from;
    if (to !== undefined) out.to = to;
  }
  return out;
}

/** Number of facets that narrow a list (the "filters applied" line). */
export function activeFilterCount(f: LiveReceivingFilters): number {
  return [f.search.trim() !== '', f.date !== 'All', f.warehouseId !== undefined, f.shipmentType !== 'All', f.result !== 'All'].filter(Boolean)
    .length;
}

// ─── Idempotency (BR-118) ────────────────────────────────────────────────────

/** The Idempotency-Keys of one receiving session in the wizard. */
export interface ReceivingKeyRing {
  createKey: (body: GoodsReceiptCreate) => string;
  qcKey: (receiptId: string, body: QualityCheckCreate) => string;
  counterKey: (receiptId: string, body: CounterOfferCreate) => string;
  discrepancyKey: (receiptId: string, body: GoodsReceiptDiscrepancyCreate) => string;
}

/**
 * One key per logical request: the same body reuses its key on a retry (the
 * server replays the original answer, BR-118), a changed body gets a new one,
 * and the writes never share a key. Discrepancies keep one key PER body,
 * since a session may persist several different reports.
 */
export function createReceivingKeyRing(generate: () => string = newIdempotencyKey): ReceivingKeyRing {
  const create = createIdempotencyKeyCache(generate);
  const qc = createIdempotencyKeyCache(generate);
  const counter = createIdempotencyKeyCache(generate);
  const discrepancies = new Map<string, string>();
  return {
    createKey: (body) => create.keyFor(bodyFingerprint(body)),
    qcKey: (receiptId, body) => qc.keyFor(bodyFingerprint({ receiptId, body })),
    counterKey: (receiptId, body) => counter.keyFor(bodyFingerprint({ receiptId, body })),
    discrepancyKey: (receiptId, body) => {
      const fingerprint = bodyFingerprint({ receiptId, body });
      const known = discrepancies.get(fingerprint);
      if (known !== undefined) return known;
      const key = generate();
      discrepancies.set(fingerprint, key);
      return key;
    },
  };
}

/**
 * True when a failed write may still have been written: no answer
 * (NetworkError) or a 5xx (a gateway may answer 5xx after the commit). A 4xx
 * was refused.
 */
export function isOutcomeUnknown(err: unknown): boolean {
  if (err instanceof NetworkError) return true;
  if (err instanceof ApiError) return err.problem.status >= 500;
  return false;
}

// ─── Bodies ──────────────────────────────────────────────────────────────────

export interface GoodsReceiptDraft {
  purchaseOrderId: string;
  warehouseId: string;
  grossGrams: number;
  vehicleNumber?: string | undefined;
  /** BR-123: sent only together with a unit. */
  packageCount?: number | undefined;
  packageUnit?: GoodsReceiptPackageUnit | undefined;
}

export function buildGoodsReceiptBody(draft: GoodsReceiptDraft): GoodsReceiptCreate {
  const vehicle = text(draft.vehicleNumber);
  const packages =
    typeof draft.packageCount === 'number' && Number.isSafeInteger(draft.packageCount) && draft.packageCount >= 1 && draft.packageUnit !== undefined
      ? { packageCount: draft.packageCount, packageUnit: draft.packageUnit }
      : {};
  return {
    purchaseOrderId: draft.purchaseOrderId,
    warehouseId: draft.warehouseId,
    grossQtyKg: gramsToKgString(draft.grossGrams),
    ...(vehicle === undefined ? {} : { vehicleNumber: vehicle }),
    ...packages,
  };
}

/** The server rule: accepted + rejected must not exceed the gross; whole grams, gross above zero. */
export function receiptQuantitiesValid(gross: number | null, accepted: number | null, rejected: number | null): boolean {
  if (gross === null || accepted === null || rejected === null) return false;
  if (![gross, accepted, rejected].every((n) => Number.isSafeInteger(n))) return false;
  if (gross <= 0 || accepted < 0 || rejected < 0) return false;
  return accepted + rejected <= gross;
}

/** The outcome a split means: nothing accepted = rejected, nothing rejected = accepted. */
export function qualityOutcomeOf(acceptedGrams: number, rejectedGrams: number): QualityOutcome {
  if (acceptedGrams === 0) return 'REJECTED';
  if (rejectedGrams === 0) return 'ACCEPTED';
  return 'PARTIALLY_ACCEPTED';
}

/** One checklist row as the admin recorded it. */
export interface QcPointDraft {
  result: LiveQcResult;
  condition?: QcConditionLevel | undefined;
  remarks?: string | undefined;
}

/** What the wizard collected for the quality check. Typed inputs stay as typed text. */
export interface QcDraft {
  assignedGrade: Grade;
  grossGrams: number | null;
  acceptedGrams: number | null;
  points: Record<QcCriterionId, QcPointDraft>;
  /** Typed percentage, '' when not measured. */
  moisturePct: string;
  /** Typed whole number 0-10, '' when not scored. */
  visualScore: string;
  defectNotes: string;
  /** BR-120: parts of the rejected weight. */
  damagedGrams?: number | null | undefined;
  spoiledGrams?: number | null | undefined;
  rejectionReasonCode?: QcRejectionReasonCode | undefined;
  /** Free-text note on the rejection. */
  rejectionNote?: string | undefined;
  /** BR-106: the storage location's code, copied onto the batch. */
  storageLocationCode?: string | undefined;
}

export type QcDraftProblem = 'quantities' | 'breakdown' | 'moisture' | 'visualScore' | 'rejectionReasonRequired';

export const QC_DRAFT_PROBLEM_MESSAGE: Record<QcDraftProblem, TranslationKey> = {
  quantities: 'receiving.qc.problem.quantities',
  breakdown: 'receiving.qc.problem.breakdown',
  moisture: 'receiving.qc.problem.moisture',
  visualScore: 'receiving.qc.problem.visualScore',
  rejectionReasonRequired: 'receiving.qc.problem.defectNotesRequired',
};

const MOISTURE_RE = /^\d{1,3}(\.\d{1,2})?$/;
const SCORE_RE = /^\d{1,2}$/;
/** docs/openapi.yaml bounds: moisturePct 0-100, visualScore 0-10 (the API's own schema, not business thresholds). */
const MOISTURE_MAX = 100;
const SCORE_MAX = 10;

function moistureOf(input: string): number | null | undefined {
  const value = input.trim();
  if (value === '') return undefined;
  if (!MOISTURE_RE.test(value)) return null;
  // A measured percentage, not money or weight: a number is what the API takes.
  const pct = Number(value);
  return pct >= 0 && pct <= MOISTURE_MAX ? pct : null;
}

function scoreOf(input: string): number | null | undefined {
  const value = input.trim();
  if (value === '') return undefined;
  if (!SCORE_RE.test(value)) return null;
  const score = Number(value);
  return score >= 0 && score <= SCORE_MAX ? score : null;
}

function rejectedOf(draft: QcDraft): number | null {
  return draft.grossGrams === null || draft.acceptedGrams === null ? null : draft.grossGrams - draft.acceptedGrams;
}

function part(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : 0;
}

/** The first thing wrong with the draft, or null when it can be sent. */
export function qcDraftProblem(draft: QcDraft): QcDraftProblem | null {
  const rejected = rejectedOf(draft);
  if (!receiptQuantitiesValid(draft.grossGrams, draft.acceptedGrams, rejected)) return 'quantities';
  if (part(draft.damagedGrams) + part(draft.spoiledGrams) > (rejected ?? 0)) return 'breakdown';
  if (moistureOf(draft.moisturePct) === null) return 'moisture';
  if (scoreOf(draft.visualScore) === null) return 'visualScore';
  // The server refuses a rejected quantity without a code, a note or defect notes.
  if (
    (rejected ?? 0) > 0 &&
    draft.rejectionReasonCode === undefined &&
    text(draft.rejectionNote) === undefined &&
    text(draft.defectNotes) === undefined
  ) {
    return 'rejectionReasonRequired';
  }
  return null;
}

function itemOf(id: QcCriterionId, point: QcPointDraft | undefined): QualityCheckItem {
  const remarks = text(point?.remarks);
  return {
    parameter: QC_PARAMETER[id],
    // A row passes only when it passed; "needs attention" is not a pass.
    passed: (point?.result ?? 'pass') === 'pass',
    ...(point?.condition === undefined ? {} : { condition: point.condition }),
    ...(remarks === undefined ? {} : { remarks }),
  };
}

/** The QualityCheckCreate body; throws on a draft qcDraftProblem() refuses. */
export function buildQualityCheckBody(draft: QcDraft): QualityCheckCreate {
  const problem = qcDraftProblem(draft);
  if (problem !== null) throw new RangeError(`quality check draft is not valid: ${problem}`);
  const accepted = draft.acceptedGrams ?? 0;
  const rejected = rejectedOf(draft) ?? 0;
  const moisture = moistureOf(draft.moisturePct);
  const score = scoreOf(draft.visualScore);
  const notes = text(draft.defectNotes);
  const note = text(draft.rejectionNote);
  const location = text(draft.storageLocationCode);
  const damaged = part(draft.damagedGrams);
  const spoiled = part(draft.spoiledGrams);
  return {
    assignedGrade: draft.assignedGrade,
    outcome: qualityOutcomeOf(accepted, rejected),
    acceptedQtyKg: gramsToKgString(accepted),
    rejectedQtyKg: gramsToKgString(rejected),
    ...(rejected > 0 && draft.rejectionReasonCode !== undefined ? { rejectionReasonCode: draft.rejectionReasonCode } : {}),
    ...(rejected > 0 && note !== undefined ? { rejectionReason: note } : {}),
    ...(damaged > 0 ? { damagedQtyKg: gramsToKgString(damaged) } : {}),
    ...(spoiled > 0 ? { spoiledQtyKg: gramsToKgString(spoiled) } : {}),
    ...(typeof moisture === 'number' ? { moisturePct: moisture } : {}),
    ...(typeof score === 'number' ? { visualScore: score } : {}),
    ...(notes === undefined ? {} : { defectNotes: notes }),
    ...(location === undefined ? {} : { storageLocation: location }),
    items: QC_ORDER.map((id) => itemOf(id, draft.points[id])),
  };
}

export interface CounterOfferDraft {
  /** Rupees per kg as typed. */
  priceInput: string;
  quantityGrams: number;
  message: string;
}

/** The CounterOfferCreate body, or null when the price or quantity cannot be sent. */
export function buildCounterOfferBody(draft: CounterOfferDraft): CounterOfferCreate | null {
  const paise = parseRupeesToPaise(draft.priceInput);
  if (paise === null || paise <= 0) return null;
  if (!Number.isSafeInteger(draft.quantityGrams) || draft.quantityGrams <= 0) return null;
  const message = text(draft.message);
  return {
    pricePerKg: fromPaise(paise),
    quantityKg: gramsToKgString(draft.quantityGrams),
    ...(message === undefined ? {} : { message }),
  };
}
