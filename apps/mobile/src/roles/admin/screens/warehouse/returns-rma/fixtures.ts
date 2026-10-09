/**
 * Mock data for the returns (RMA) screens until the RMA endpoints are wired
 * (no RMA route in docs/openapi.yaml yet, see SPEC_GAPS.md W4e-1).
 *
 * Moved out of the old SubWarehouseReturnsIssuesScreen /
 * SubWarehouseReturnHistoryScreen so the screens hold no sample literals. No
 * record carries a warehouse here: the warehouse comes from the viewer's scope
 * (or, once wired, from the API), never from a 'Coonoor Warehouse' literal.
 */
import type { ReturnHistoryRecord, ReturnTimelineItem, RmaRecord } from './types';

export const INITIAL_RMA_ITEMS: readonly RmaRecord[] = [
  {
    id: 'rma-1',
    rmaId: 'RMA-2026-00125',
    orderId: 'ORD-002145',
    customerName: 'Ravi Kumar',
    customerId: 'CUS-001245',
    customerPhone: '+91 XXXXX XXXXX',
    orderDate: '24 Sep 2026',
    salesChannel: 'Online Order',
    paymentStatus: 'Paid',
    productName: 'Tomato',
    grade: 'Grade 1',
    quantityPurchased: '5 KG',
    unitPrice: '₹100 / KG',
    lineTotal: '₹500',
    issueCategory: 'Damaged',
    reportedDate: '25 Sep 2026',
    timestampText: '25 Sep 2026 · 10:30 AM',
    description: 'Customer reported damaged produce after pickup.',
    ticketId: 'TKT-2026-00125',
    requestedQuantity: '2 KG',
    requestedResolution: 'Refund',
    status: 'New',
  },
  {
    id: 'rma-2',
    rmaId: 'RMA-2026-00119',
    orderId: 'ORD-002130',
    customerName: 'Anitha',
    customerId: 'CUS-001188',
    customerPhone: '+91 98412 34567',
    orderDate: '23 Sep 2026',
    salesChannel: 'Market Counter',
    paymentStatus: 'Paid',
    productName: 'Cabbage',
    grade: 'Grade 1',
    quantityPurchased: '3 KG',
    unitPrice: '₹40 / KG',
    lineTotal: '₹120',
    issueCategory: 'Quality',
    reportedDate: '24 Sep 2026',
    timestampText: '24 Sep 2026 · 3:15 PM',
    description: 'Outer leaves wilting and discoloration observed.',
    ticketId: 'TKT-2026-00119',
    requestedQuantity: '1 KG',
    requestedResolution: 'Refund',
    status: 'Under Review',
  },
  {
    id: 'rma-3',
    rmaId: 'RMA-2026-00115',
    orderId: 'ORD-002102',
    customerName: 'Kavitha S.',
    customerId: 'CUS-001045',
    customerPhone: '+91 94432 11223',
    orderDate: '22 Sep 2026',
    salesChannel: 'Online Order',
    paymentStatus: 'Paid',
    productName: 'Garlic',
    grade: 'Premium',
    quantityPurchased: '2 KG',
    unitPrice: '₹220 / KG',
    lineTotal: '₹440',
    issueCategory: 'Missing',
    reportedDate: '23 Sep 2026',
    timestampText: '23 Sep 2026 · 11:20 AM',
    description: 'Item missing from dispatch crate box.',
    ticketId: 'TKT-2026-00115',
    requestedQuantity: '1 KG',
    requestedResolution: 'Replacement',
    status: 'Approved',
  },
  {
    id: 'rma-4',
    rmaId: 'RMA-2026-00108',
    orderId: 'ORD-002095',
    customerName: 'Suresh M.',
    customerId: 'CUS-000982',
    customerPhone: '+91 98844 55667',
    orderDate: '21 Sep 2026',
    salesChannel: 'HORECA Supply',
    paymentStatus: 'Paid',
    productName: 'Potato',
    grade: 'Grade 2',
    quantityPurchased: '20 KG',
    unitPrice: '₹35 / KG',
    lineTotal: '₹700',
    issueCategory: 'Wrong',
    reportedDate: '22 Sep 2026',
    timestampText: '22 Sep 2026 · 04:45 PM',
    description: 'Received small grade potatoes instead of Grade 1 standard.',
    ticketId: 'TKT-2026-00108',
    requestedQuantity: '5 KG',
    requestedResolution: 'Credit Note',
    status: 'Pending Resolution',
  },
];

/** The RMA a deep link without params opens on (the old screens fell back to the first item). */
export const SAMPLE_RMA: RmaRecord = INITIAL_RMA_ITEMS[0] as RmaRecord;

/** Mock refund amount / transaction id the old shells hard-coded for every RMA. */
export const SAMPLE_REFUND_AMOUNT = '₹200.00';
export const SAMPLE_REFUND_TRANSACTION_ID = 'REF-2026-001245';

/** Mock inspection defaults the review step showed when reached without an inspection. */
export const SAMPLE_INSPECTED_QTY = '1.8 KG';
export const SAMPLE_INSPECTION_NOTES = 'Product partially damaged...';

/** Mock KPI tiles and category counts of the Returns & Issues hub. */
export const RMA_STATUS_COUNTS = {
  newRequests: 8,
  underReview: 5,
  approved: 12,
  pendingResolution: 3,
} as const;

export const RMA_CATEGORY_COUNTS: readonly { label: string; count: number }[] = [
  { label: 'QUALITY', count: 4 },
  { label: 'QUANTITY', count: 2 },
  { label: 'MISSING', count: 1 },
  { label: 'WRONG', count: 1 },
  { label: 'DAMAGED', count: 3 },
  { label: 'LATE', count: 2 },
];

export const RMA_DETAIL_TIMELINE: readonly ReturnTimelineItem[] = [
  { id: '1', title: 'Issue Reported', time: '25 Sep, 10:30 AM' },
  { id: '2', title: 'RMA Created', time: '25 Sep, 10:30 AM' },
  { id: '3', title: 'Assigned for Review', time: '25 Sep, 10:35 AM' },
  { id: '4', title: 'Inspection Pending', time: '25 Sep, 10:40 AM' },
];

export const REVIEW_TIMELINE: readonly ReturnTimelineItem[] = [
  { id: '1', title: 'Issue Reported' },
  { id: '2', title: 'RMA Created' },
  { id: '3', title: 'Inspection Completed' },
  { id: '4', title: 'Ready for Review' },
];

export const REFUND_TIMELINE: readonly ReturnTimelineItem[] = [
  { id: '1', title: 'Return Approved', time: '25 Sep · 11:20 AM' },
  { id: '2', title: 'Refund Initiated', time: '25 Sep · 11:22 AM' },
  { id: '3', title: 'Wallet Credited', time: '25 Sep · 11:22 AM' },
];

const COMPLETED_TIMELINE: ReturnTimelineItem[] = [
  { id: '1', title: 'Issue Reported', time: '25 Sep, 10:30 AM' },
  { id: '2', title: 'Inspection Completed', time: '25 Sep, 10:55 AM' },
  { id: '3', title: 'Return Approved', time: '25 Sep, 11:20 AM' },
  { id: '4', title: 'Refund Completed', time: '25 Sep, 11:22 AM' },
];

export const INITIAL_RETURN_HISTORY: readonly ReturnHistoryRecord[] = [
  {
    rmaId: 'RMA-2026-00125',
    orderId: 'ORD-002145',
    customerName: 'Ravi Kumar',
    reasonTag: 'Damaged',
    status: 'Completed',
    date: '25 Sep 2026',
    refundAmount: '₹200',
    inspectionResult: 'Issue Confirmed',
    returnedQuantity: '1.8 KG',
    inspectionNotes: '2 KG received. 0.5 KG visibly damaged.',
    decision: 'Approved',
    decisionDate: '25 Sep 2026',
    processedBy: 'Warehouse Admin – Suresh',
    refundStatus: 'Completed',
    refundMethod: 'TOHFA Wallet',
    refundReference: 'REF-2026-001245',
    timeline: COMPLETED_TIMELINE,
  },
  {
    rmaId: 'RMA-2026-00108',
    orderId: 'ORD-002098',
    customerName: 'Ganesh K.',
    reasonTag: 'Late',
    status: 'Rejected',
    date: '22 Sep 2026',
    inspectionResult: 'No Defect Found',
    returnedQuantity: '0.0 KG',
    inspectionNotes: 'Customer return request rejected due to return window elapsed.',
    decision: 'Rejected',
    decisionDate: '22 Sep 2026',
    processedBy: 'Warehouse Admin – Suresh',
    refundStatus: 'None',
    refundMethod: 'N/A',
    timeline: [
      { id: '1', title: 'Issue Reported', time: '22 Sep, 02:15 PM' },
      { id: '2', title: 'Return Rejected', time: '22 Sep, 03:00 PM' },
    ],
  },
];

/** The history record a deep link without params opens on. */
export const SAMPLE_RETURN_HISTORY_RECORD: ReturnHistoryRecord = INITIAL_RETURN_HISTORY[0] as ReturnHistoryRecord;

/** Inspection result options of the inspect form. */
export const INSPECTION_RESULT_OPTIONS: readonly string[] = [
  'Damage Confirmed',
  'Partial Damage',
  'Quality Degradation',
  'No Defect Found',
];
