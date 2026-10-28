/**
 * Mappers between the backend invoice DTOs and the billing-invoices screen models.
 * Rules:
 *   - BR-16: Buyer name / GSTIN is hidden (farm-anonymous / customer privacy)
 *   - Money = integer paise (Money type)
 */
import { format as formatMoney, fromPaise, parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import type { InvoiceDetailDto, InvoiceDto, InvoiceStatus as ApiInvoiceStatus, InvoiceType } from '../../../api/invoices';
import type {
  InvoiceDetailRecord,
  InvoiceLineItem,
  InvoiceRecord,
  InvoiceSaleType,
  InvoiceStatus,
} from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatCalendarDate(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split('-');
  if (parts.length !== 3) return yyyyMmDd;
  const year = parts[0];
  const monthIdx = parseInt(parts[1] ?? '1', 10) - 1;
  const month = MONTHS[monthIdx] ?? parts[1];
  const day = (parts[2] ?? '01').padStart(2, '0');
  return `${day} ${month} ${year}`;
}

export function mapSaleType(type: InvoiceType): InvoiceSaleType {
  switch (type) {
    case 'SALE_RETAIL':
      return 'Retail Sale';
    case 'SALE_B2B':
      return 'B2B Sale';
    case 'PURCHASE_FARMER':
      return 'Market Sale';
    default:
      return 'Retail Sale';
  }
}

export function mapInvoiceStatus(status: ApiInvoiceStatus): InvoiceStatus {
  switch (status) {
    case 'ISSUED':
      return 'Generated';
    case 'DRAFT':
      return 'Pending';
    case 'CANCELLED':
    case 'CREDIT_NOTED':
      return 'Cancelled';
    default:
      return 'Generated';
  }
}

export function formatMoneyAmount(amount: Money | string | number | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return '₹0.00';
  try {
    const money = parseMoney(String(amount));
    return formatMoney(money);
  } catch {
    return `₹${amount}`;
  }
}

export function mapInvoiceDtoToRecord(dto: InvoiceDto): InvoiceRecord {
  return {
    id: dto.invoiceNumber,
    orderNumber: dto.orderId ?? dto.purchaseOrderId ?? '—',
    // BR-16: Buyer name / GSTIN must be hidden
    customerName: '',
    saleType: mapSaleType(dto.invoiceType),
    amount: formatMoneyAmount(dto.totalAmount),
    date: formatCalendarDate(dto.issueDate),
    time: '—',
    status: mapInvoiceStatus(dto.status),
    warehouseId: undefined,
  };
}

export function mapInvoiceDetailDtoToRecord(dto: InvoiceDetailDto): InvoiceDetailRecord {
  const items: InvoiceLineItem[] = (dto.lines ?? []).map((line) => ({
    name: line.description,
    grade: line.hsnCode ? `HSN: ${line.hsnCode}` : '—',
    unit: 'kg',
    quantity: `${line.qty} kg`,
    unitPrice: formatMoneyAmount(line.unitPrice),
    lineTotal: formatMoneyAmount(line.total),
  }));

  const taxTotalPaise = (
    (dto.cgst ? toPaise(dto.cgst) : 0) +
    (dto.sgst ? toPaise(dto.sgst) : 0) +
    (dto.igst ? toPaise(dto.igst) : 0)
  );
  const gstDisplay = taxTotalPaise > 0 ? formatMoney(fromPaise(taxTotalPaise)) : '₹0.00';

  return {
    invoiceId: dto.invoiceNumber,
    orderNumber: dto.orderId ?? dto.purchaseOrderId ?? '—',
    date: formatCalendarDate(dto.issueDate),
    salesChannel: mapSaleType(dto.invoiceType),
    invoiceType: mapSaleType(dto.invoiceType),
    status: mapInvoiceStatus(dto.status),
    warehouseId: undefined,
    warehouseName: undefined,
    // BR-16: Customer details hidden
    customerName: '',
    customerId: '',
    customerPhone: '',
    items,
    subtotal: formatMoneyAmount(dto.taxableAmount ?? dto.totalAmount),
    discount: '₹0.00',
    gst: gstDisplay,
    total: formatMoneyAmount(dto.totalAmount),
    paymentStatus: 'Completed',
    paymentMethod: '—',
    downloadAvailable: Boolean(dto.pdfUrl || true),
  };
}
