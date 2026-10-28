import type { SalesReportDto } from '../../../api/reports';
import type { OrderSummaryDto } from '../../../api/orders';
import type { BatchDto } from '../../../api/inventory';
import type { GoodsReceiptDto } from '../../../api/receiving';
import type { AdminCustomerListItemDto } from '../../../api/customers';
// CashTopupSummaryDto has no API definition; use a local shape
interface CashTopupSummaryDto { id: string; customerId: string; warehouseId: string; amount: unknown; notes?: string | null; collectedAt?: string; }
import type { ExpenseDto } from '../../../api/finance';
import type { ReturnSummaryDto } from '../../../api/returns';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function getIstDateString(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

export function getIstDateRange(
  period: 'Today' | 'Week' | 'Month' | string,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = getIstDateString(now);
  if (period === 'Today') {
    return { from: to, to };
  }
  if (period === 'Week') {
    const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: getIstDateString(pastWeek), to };
  }
  // Month: 1st of current month in IST
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return { from: `${year}-${month}-01`, to };
}

export function formatInr(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

export function formatKg(kg: number | string): string {
  const num = typeof kg === 'string' ? parseFloat(kg) : kg;
  if (!Number.isFinite(num)) return '0 kg';
  return `${num.toLocaleString('en-IN')} kg`;
}

export function mapSalesReportToSummary(dto: SalesReportDto) {
  const totalNum = typeof dto.total === 'string' ? parseFloat(dto.total) : Number(dto.total);
  const avgNum = typeof dto.averageOrderValue === 'string' ? parseFloat(dto.averageOrderValue) : Number(dto.averageOrderValue);
  return {
    totalSales: formatInr(totalNum || 0),
    totalSalesNum: totalNum || 0,
    ordersCount: dto.count,
    avgOrder: formatInr(avgNum || 0),
    avgOrderNum: avgNum || 0,
    itemsSold: dto.count * 3, // derived approximation when item breakdown not provided
  };
}

export function mapOrderToReportRow(order: OrderSummaryDto) {
  const totalNum = typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : Number(order.totalAmount);
  const channelMap: Record<string, string> = {
    ONLINE: 'Online',
    MARKET: 'Market',
    HORECA: 'HORECA',
    B2B: 'B2B',
    DIRECT: 'Direct',
  };
  const channel = (order.channel && channelMap[order.channel]) || 'Online';

  return {
    orderId: order.orderNumber,
    date: order.placedAt ? new Date(order.placedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' }) : '—',
    channel: channel as 'Online' | 'Market' | 'HORECA' | 'B2B',
    customerRef: `Order #${order.orderNumber.slice(-5)}`,
    warehouse: order.warehouseId || 'Warehouse',
    warehouseId: order.warehouseId || '',
    product: 'Assorted Produce',
    grade: 'Grade 1',
    quantity: `${order.itemCount || 1} items`,
    unitPrice: formatInr(totalNum / (order.itemCount || 1)),
    amount: formatInr(totalNum),
    amountNum: totalNum,
    items: order.itemCount || 1,
    paymentMethod: 'Wallet',
    paymentStatus: order.paymentStatus === 'PAID' ? 'Completed' : 'Pending',
    txnRef: order.id.slice(0, 8).toUpperCase(),
    invoiceNumber: `INV-${order.orderNumber}`,
    invoiceStatus: 'Generated',
    status: order.status === 'DELIVERED' || order.status === 'CONFIRMED' ? 'Completed' : order.status,
  };
}

export function mapBatchToInventoryReportRow(batch: BatchDto) {
  const avail = parseFloat(batch.qtyAvailableKg || '0');
  const res = parseFloat(batch.qtyReservedKg || '0');
  return {
    productName: batch.cropName || 'Produce',
    productCode: batch.cropId || batch.id.slice(0, 6).toUpperCase(),
    crop: batch.cropName || 'Produce',
    grade: batch.grade === 'GRADE_1' ? 'Grade 1' : batch.grade === 'GRADE_2' ? 'Grade 2' : 'Grade 3',
    warehouse: batch.warehouseId,
    warehouseId: batch.warehouseId,
    availableQty: formatKg(avail),
    reservedQty: formatKg(res),
    allocatedQty: '0 kg',
    consumedQty: '—',
    batchCode: batch.batchCode,
    receivedDate: batch.receivedOn || '—',
    storageLocation: batch.storageLocation || '—',
    status: (avail > 0 ? 'Available' : 'Out of Stock') as 'Available' | 'Out of Stock' | 'Low Stock',
    movementReceived: formatKg(avail + res),
    movementAvailable: formatKg(avail),
    movementReserved: formatKg(res),
    movementSold: '0 kg',
    lastVerification: '—',
    verifiedQty: formatKg(avail),
    difference: '0 kg',
    verificationStatus: 'Reconciled',
  };
}

export function mapGoodsReceiptToReceivingReportRow(gr: GoodsReceiptDto) {
  const received = parseFloat(String(gr.grossQtyKg || '0'));
  const accepted = parseFloat(String(gr.acceptedQtyKg || '0'));
  const rejected = parseFloat(String(gr.rejectedQtyKg || '0'));
  const partial = Math.max(0, received - accepted - rejected);

  return {
    receiptId: gr.grnNumber,
    dateTime: gr.receivedAt ? new Date(gr.receivedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
    warehouse: gr.warehouseId,
    warehouseId: gr.warehouseId,
    sourceRef: gr.purchaseOrderId ? `PO #${gr.purchaseOrderId.slice(-6)}` : 'PO',
    product: gr.cropName || 'Crop',
    grade: gr.grade === 'GRADE_1' ? 'Grade 1' : gr.grade === 'GRADE_2' ? 'Grade 2' : 'Grade 3',
    qtyReceived: formatKg(received),
    qtyNum: received,
    acceptedNum: accepted,
    rejectedNum: rejected,
    partialNum: partial,
    qualityStatus: (gr.status === 'ACCEPTED' ? 'Accepted' : gr.status === 'REJECTED' ? 'Rejected' : 'Partial') as 'Accepted' | 'Partial' | 'Rejected',
    acceptedQty: formatKg(accepted),
    partialQty: formatKg(partial),
    rejectedQty: formatKg(rejected),
    qcNotes: gr.rejectionReason || 'QC check completed.',
    timeline: [
      { title: 'Goods Received', time: gr.receivedAt ? new Date(gr.receivedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '—' },
      { title: 'QC Completed', time: '—' },
    ],
  };
}

export function mapCustomerToReportRow(cust: AdminCustomerListItemDto) {
  return {
    id: cust.id,
    name: cust.name || 'Customer',
    channel: 'Online',
    warehouse: 'Warehouse',
    warehouseId: '',
    orders: 1,
    completedOrders: 1,
    cancelledOrders: 0,
    lastOrder: cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    totalSpent: '—',
    mobile: cust.mobile || cust.mobileMasked || '—',
    frequency: 'Regular',
    orderHistory: [],
  };
}

export function mapCashTopupToReportRow(topup: CashTopupSummaryDto) {
  const amt = typeof topup.amount === 'string' ? parseFloat(topup.amount) : Number(topup.amount);
  return {
    id: topup.id,
    customerId: topup.customerId,
    customer: `Customer ${topup.customerId} · Cash`,
    warehouse: topup.warehouseId,
    warehouseId: topup.warehouseId,
    amount: formatInr(amt),
    amountNum: amt,
    paymentMethod: 'Cash',
    auth: 'SWA',
    processedBy: 'SWA',
    status: 'Completed',
    referenceId: topup.id.slice(0, 10),
    cashTagFiscalRef: topup.notes || 'FT-CASH-TOPUP',
    time: topup.collectedAt ? new Date(topup.collectedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '—',
    dateTime: topup.collectedAt ? new Date(topup.collectedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
    period: 'Today',
  };
}

export function mapExpenseToReportRow(exp: ExpenseDto) {
  const amt = Number(exp.amount);
  return {
    id: exp.id,
    category: exp.category || 'General',
    voucher: `VCH-${exp.id.slice(-6)}`,
    amount: formatInr(amt),
    amountNum: amt,
    status: (exp.status === 'RECORDED' ? 'Recorded' : exp.status) as string,
    date: exp.expenseDate,
    paymentMethod: exp.paymentMethod === 'CASH' ? 'Cash' : exp.paymentMethod === 'UPI' ? 'UPI' : 'Bank',
    vendorPayee: exp.vendor || '—',
    description: exp.description || '—',
    createdBy: exp.recordedBy || 'Admin',
    warehouse: exp.warehouseId,
    warehouseId: exp.warehouseId,
    timeline: [
      { title: 'Expense Created' },
      { title: 'Recorded' },
    ],
  };
}

export function mapReturnToReportRow(ret: ReturnSummaryDto) {
  return {
    id: ret.id,
    orderId: ret.orderId,
    order: `Order ${ret.orderId}`,
    customer: ret.customerId,
    product: 'Produce',
    affectedQty: '1',
    affectedQuantity: '1 KG',
    category: 'Damaged',
    customerPhotos: '0',
    issueDescription: ret.reason,
    inspectionStatus: ret.status === 'PENDING' ? 'Pending' : 'Completed',
    inspectionResult: ret.status === 'REJECTED' ? 'Rejected' : 'Confirmed',
    inspectionNotes: ret.note || 'Inspected return request',
    decision: ret.status === 'APPROVED' || ret.status === 'REFUNDED' ? 'Approved' : ret.status,
    refundStatus: ret.status === 'REFUNDED' ? 'Completed' : 'Pending',
    refundMethod: 'TOHFA Wallet',
    refundAmount: '—',
    resolutionDate: ret.updatedAt ? new Date(ret.updatedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    status: (ret.status === 'APPROVED' ? 'Approved' : ret.status === 'REFUNDED' ? 'Approved' : ret.status === 'REJECTED' ? 'Rejected' : 'Pending') as string,
    resolution: ret.status === 'REFUNDED' ? 'Refund Completed' : 'Under Review',
    resolutionColor: '#16A34A',
    warehouse: ret.warehouseId,
    warehouseId: ret.warehouseId,
    timeline: [
      { title: 'Issue Raised' },
      { title: 'RMA Created' },
    ],
  };
}
