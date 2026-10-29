import type { SalesReportDto } from '../../../api/reports';
import type { OrderSummaryDto } from '../../../api/orders';
import type { BatchDto } from '../../../api/inventory';
import type { GoodsReceiptDto } from '../../../api/receiving';
import type { AdminCustomerListItemDto } from '../../../api/customers';
import type { ExpenseDto } from '../../../api/finance';
import type { ReturnSummaryDto } from '../../../api/returns';
import { formatMoney } from '../orders/mappers';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { adminColors } from '../../../theme';

// CashTopupSummaryDto has no API definition; use a local shape
interface CashTopupSummaryDto {
  id: string;
  customerId: string;
  warehouseId: string;
  amount: unknown;
  notes?: string | null;
  collectedAt?: string;
}

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

export { formatMoney, formatKg };

export function formatInr(amount: number | string | null | undefined): string {
  if (amount == null) return '—';
  return formatMoney(String(amount));
}

export function mapSalesReportToSummary(dto: SalesReportDto) {
  return {
    totalSales: formatMoney(dto.total),
    totalSalesNum: Number(dto.total) || 0,
    ordersCount: dto.count,
    avgOrder: formatMoney(dto.averageOrderValue),
    avgOrderNum: Number(dto.averageOrderValue) || 0,
  };
}

export function mapOrderToReportRow(order: OrderSummaryDto) {
  const totalNum = Number(order.totalAmount) || 0;
  const channelMap: Record<string, string> = {
    ONLINE: 'Online',
    MARKET: 'Market',
    HORECA: 'HORECA',
    B2B: 'B2B',
    DIRECT: 'Direct',
  };
  const channel = (order.channel && channelMap[order.channel]) || '—';

  return {
    orderId: order.orderNumber,
    date: order.placedAt ? new Date(order.placedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' }) : '—',
    channel: channel as 'Online' | 'Market' | 'HORECA' | 'B2B',
    customerRef: `Order #${order.orderNumber}`,
    warehouse: order.warehouseId || '—',
    warehouseId: order.warehouseId || '',
    product: '—',
    grade: '—',
    quantity: order.itemCount ? `${order.itemCount} items` : '—',
    unitPrice: '—',
    amount: formatMoney(order.totalAmount),
    amountNum: totalNum,
    items: order.itemCount || 0,
    paymentMethod: '—',
    paymentStatus: order.paymentStatus ? (order.paymentStatus === 'PAID' ? 'Completed' : 'Pending') : '—',
    txnRef: order.id.slice(0, 8).toUpperCase(),
    invoiceNumber: '—',
    invoiceStatus: '—',
    status: order.status === 'DELIVERED' || order.status === 'CONFIRMED' ? 'Completed' : order.status,
  };
}

export function mapBatchToInventoryReportRow(batch: BatchDto) {
  const availG = parseKgToGrams(batch.qtyAvailableKg || '0') ?? 0;
  const resG = parseKgToGrams(batch.qtyReservedKg || '0') ?? 0;
  return {
    productName: batch.cropName || '—',
    productCode: batch.cropId || batch.id.slice(0, 6).toUpperCase(),
    crop: batch.cropName || '—',
    grade: batch.grade === 'GRADE_1' ? 'Grade 1' : batch.grade === 'GRADE_2' ? 'Grade 2' : batch.grade === 'GRADE_3' ? 'Grade 3' : '—',
    warehouse: batch.warehouseId,
    warehouseId: batch.warehouseId,
    availableQty: formatKg(availG),
    reservedQty: formatKg(resG),
    allocatedQty: '0 kg',
    consumedQty: '—',
    batchCode: batch.batchCode,
    receivedDate: batch.receivedOn || '—',
    storageLocation: batch.storageLocation || '—',
    status: (availG > 0 ? 'Available' : 'Out of Stock') as 'Available' | 'Out of Stock' | 'Low Stock',
    movementReceived: formatKg(availG + resG),
    movementAvailable: formatKg(availG),
    movementReserved: formatKg(resG),
    movementSold: '0 kg',
    lastVerification: '—',
    verifiedQty: formatKg(availG),
    difference: '0 kg',
    verificationStatus: 'Reconciled',
  };
}

export function mapGoodsReceiptToReceivingReportRow(gr: GoodsReceiptDto) {
  const receivedG = parseKgToGrams(String(gr.grossQtyKg || '0')) ?? 0;
  const acceptedG = parseKgToGrams(String(gr.acceptedQtyKg || '0')) ?? 0;
  const rejectedG = parseKgToGrams(String(gr.rejectedQtyKg || '0')) ?? 0;
  const partialG = Math.max(0, receivedG - acceptedG - rejectedG);

  return {
    receiptId: gr.grnNumber,
    dateTime: gr.receivedAt ? new Date(gr.receivedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
    warehouse: gr.warehouseId,
    warehouseId: gr.warehouseId,
    sourceRef: gr.purchaseOrderId ? `PO #${gr.purchaseOrderId.slice(-6)}` : 'PO',
    product: gr.cropName || '—',
    grade: gr.grade === 'GRADE_1' ? 'Grade 1' : gr.grade === 'GRADE_2' ? 'Grade 2' : gr.grade === 'GRADE_3' ? 'Grade 3' : '—',
    qtyReceived: formatKg(receivedG),
    qtyNum: receivedG / 1000,
    acceptedNum: acceptedG / 1000,
    rejectedNum: rejectedG / 1000,
    partialNum: partialG / 1000,
    qualityStatus: (gr.status === 'ACCEPTED' ? 'Accepted' : gr.status === 'REJECTED' ? 'Rejected' : 'Partial') as 'Accepted' | 'Partial' | 'Rejected',
    acceptedQty: formatKg(acceptedG),
    partialQty: formatKg(partialG),
    rejectedQty: formatKg(rejectedG),
    qcNotes: gr.rejectionReason || '—',
    timeline: [
      { title: 'Goods Received', time: gr.receivedAt ? new Date(gr.receivedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '—' },
      { title: 'QC Completed', time: '—' },
    ],
  };
}

export function mapCustomerToReportRow(cust: AdminCustomerListItemDto) {
  return {
    id: cust.id,
    name: cust.name || '—',
    channel: '—',
    warehouse: '—',
    warehouseId: cust.preferredWarehouseId || '',
    orders: cust.totalOrders || 0,
    completedOrders: cust.totalOrders || 0,
    cancelledOrders: 0,
    lastOrder: cust.lastActivityAt ? new Date(cust.lastActivityAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    totalSpent: '—',
    mobile: cust.mobileMasked || cust.mobile || '—',
    frequency: '—',
    orderHistory: [],
  };
}

export function mapCashTopupToReportRow(topup: CashTopupSummaryDto) {
  const amtStr = String(topup.amount ?? '0');
  const amtNum = Number(topup.amount) || 0;
  return {
    id: topup.id,
    customerId: topup.customerId,
    customer: `Customer ${topup.customerId} · Cash`,
    warehouse: topup.warehouseId,
    warehouseId: topup.warehouseId,
    amount: formatMoney(amtStr),
    amountNum: amtNum,
    paymentMethod: 'Cash',
    auth: '—',
    processedBy: '—',
    status: 'Completed',
    referenceId: topup.id.slice(0, 10),
    cashTagFiscalRef: topup.notes || '—',
    time: topup.collectedAt ? new Date(topup.collectedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '—',
    dateTime: topup.collectedAt ? new Date(topup.collectedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
    period: 'Today',
  };
}

export function mapExpenseToReportRow(exp: ExpenseDto) {
  const amtStr = String(exp.amount ?? '0');
  const amtNum = Number(exp.amount) || 0;
  return {
    id: exp.id,
    category: exp.category || 'General',
    voucher: `VCH-${exp.id.slice(-6)}`,
    amount: formatMoney(amtStr),
    amountNum: amtNum,
    status: (exp.status === 'RECORDED' ? 'Recorded' : exp.status) as string,
    date: exp.expenseDate,
    paymentMethod: exp.paymentMethod === 'CASH' ? 'Cash' : exp.paymentMethod === 'UPI' ? 'UPI' : 'Bank',
    vendorPayee: exp.vendor || '—',
    description: exp.description || '—',
    createdBy: exp.recordedBy || '—',
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
    product: '—',
    affectedQty: '—',
    affectedQuantity: '—',
    category: '—',
    customerPhotos: '0',
    issueDescription: ret.reason || '—',
    inspectionStatus: ret.status === 'PENDING' ? 'Pending' : 'Completed',
    inspectionResult: ret.status === 'REJECTED' ? 'Rejected' : 'Confirmed',
    inspectionNotes: ret.note || '—',
    decision: ret.status === 'APPROVED' || ret.status === 'REFUNDED' ? 'Approved' : ret.status,
    refundStatus: ret.status === 'REFUNDED' ? 'Completed' : 'Pending',
    refundMethod: 'TOHFA Wallet',
    refundAmount: '—',
    resolutionDate: ret.updatedAt ? new Date(ret.updatedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    status: (ret.status === 'APPROVED' ? 'Approved' : ret.status === 'REFUNDED' ? 'Approved' : ret.status === 'REJECTED' ? 'Rejected' : 'Pending') as string,
    resolution: ret.status === 'REFUNDED' ? 'Refund Completed' : 'Under Review',
    resolutionColor: adminColors.success.text,
    warehouse: ret.warehouseId,
    warehouseId: ret.warehouseId,
    timeline: [
      { title: 'Issue Raised' },
      { title: 'RMA Created' },
    ],
  };
}
