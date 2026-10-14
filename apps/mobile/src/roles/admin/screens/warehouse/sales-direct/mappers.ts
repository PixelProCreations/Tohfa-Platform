/**
 * Mappers between OpenAPI sales DTOs and warehouse UI types (design module M6).
 *
 * Rules:
 *   - Money is NEVER a float. Every amount is stored internally as integer paise (BR-98).
 *   - Quantities are integer grams (parseKgToGrams / gramsToKgString).
 *   - No float drift: e.g. 0.1 + 0.2 kg === 300g exactly.
 *   - Status enums go through exhaustive Record mapping with explicit fallback.
 *   - Server-calculated totals and GST are preserved, never recomputed client-side (BR-89).
 */
import type {
  ChannelOrderListItemDto,
  SaleCustomerMatchDto,
  SaleDto,
  SaleListItemDto,
  SalePaymentMethod,
  SalePaymentStatus,
  SaleProductDto,
  SaleQuoteDto,
  SalesMarketDayDto,
  SaleStatus,
} from '../../../api/sales';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';
import { gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import type {
  ChannelOrderItem,
  ChannelOrderLine,
  SaleCustomer,
  SaleProduct,
  SaleRecord,
} from './types';

export function salesWarehouseFilter(
  scope: { warehouseId?: string | undefined },
  selectedWarehouseId?: string | undefined,
): string | undefined {
  return scope.warehouseId ?? selectedWarehouseId;
}

const SALE_STATUS_MAP: Record<SaleStatus, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PICKED_UP: 'Completed',
  CANCELLED: 'Cancelled',
};

const PAYMENT_STATUS_MAP: Record<SalePaymentStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Paid',
  FAILED: 'Failed',
};

const PAYMENT_METHOD_MAP: Record<SalePaymentMethod, 'Cash' | 'UPI' | 'Card' | 'Wallet'> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  WALLET: 'Wallet',
};

const CHANNEL_ORDER_STATUS_MAP: Record<string, ChannelOrderItem['status']> = {
  PENDING_PAYMENT: 'Pending',
  CONFIRMED: 'Confirmed',
  PACKED: 'Processing',
  DISPATCHED: 'Processing',
  READY_FOR_PICKUP: 'Processing',
  OUT_FOR_DELIVERY: 'Processing',
  DELIVERED: 'Completed',
  PICKED_UP: 'Completed',
  CANCELLED: 'Pending',
  RETURNED: 'Pending',
};

function toPaise(val: unknown): number {
  if (val === null || val === undefined) return 0;
  return parseRupeesToPaise(val as string) ?? 0;
}

export interface MappedSaleProduct extends SaleProduct {
  availableGrams: number;
  unitPricePaise: number;
  pricePerKgText: string;
}

export function mapSaleProduct(dto: SaleProductDto): MappedSaleProduct {
  const availableGrams = parseKgToGrams(String(dto.availableQtyKg)) ?? 0;
  const unitPricePaise = toPaise(dto.unitPrice);
  const pricePerKgText = formatPaise(unitPricePaise);
  const availableKgNum = availableGrams / 1000;

  return {
    id: dto.productId,
    name: dto.name,
    grade: dto.grade,
    pricePerKg: unitPricePaise / 100,
    availableKg: availableKgNum,
    status: availableGrams > 10000 ? 'Available' : 'Low Stock',
    batch: dto.batchCode ?? undefined,
    location: dto.storageLocation ?? undefined,
    availableGrams,
    unitPricePaise,
    pricePerKgText,
  };
}

export interface MappedSaleCustomerMatch extends SaleCustomer {
  walletBalancePaise: number;
  walletBalanceText: string;
  mobileMasked: string | null;
}

export function mapSaleCustomerMatch(dto: SaleCustomerMatchDto): MappedSaleCustomerMatch {
  const walletBalancePaise = toPaise(dto.walletBalance);
  return {
    id: dto.customerId,
    code: dto.customerCode,
    name: dto.name,
    phone: dto.mobileMasked ?? '',
    orderCount: 0,
    walletBalance: walletBalancePaise / 100,
    walletBalancePaise,
    walletBalanceText: formatPaise(walletBalancePaise),
    mobileMasked: dto.mobileMasked,
  };
}

export interface MappedQuoteLine {
  productId: string;
  name: string;
  grade: string;
  qtyKg: string;
  qtyGrams: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface MappedSaleQuote {
  channel: string;
  lines: MappedQuoteLine[];
  subtotalPaise: number;
  gstPaise: number;
  totalPaise: number;
  gstRatePercent: string;
  quotedAt: string;
}

export function mapSaleQuote(dto: SaleQuoteDto): MappedSaleQuote {
  const subtotalPaise = toPaise(dto.totals.subtotal);
  const gstPaise = toPaise(dto.totals.gst);
  const totalPaise = toPaise(dto.totals.total);

  const lines: MappedQuoteLine[] = dto.lines.map((l) => ({
    productId: l.productId,
    name: l.name,
    grade: l.grade,
    qtyKg: String(l.qtyKg),
    qtyGrams: parseKgToGrams(String(l.qtyKg)) ?? 0,
    unitPricePaise: toPaise(l.unitPrice),
    lineTotalPaise: toPaise(l.lineTotal),
  }));

  return {
    channel: dto.channel,
    lines,
    subtotalPaise,
    gstPaise,
    totalPaise,
    gstRatePercent: dto.gstRatePercent,
    quotedAt: dto.quotedAt,
  };
}

export interface MappedSale extends SaleRecord {
  totalPaise: number;
  subtotalPaise: number;
  gstPaise: number;
  changeGivenPaise: number | null;
  paymentStatus: string;
}

export function mapSale(dto: SaleDto): MappedSale {
  const totalPaise = toPaise(dto.totals.total);
  const subtotalPaise = toPaise(dto.totals.subtotal);
  const gstPaise = toPaise(dto.totals.gst);
  const changeGivenPaise = dto.totals.changeGiven ? toPaise(dto.totals.changeGiven) : null;

  const status = (dto.status in SALE_STATUS_MAP) ? SALE_STATUS_MAP[dto.status as SaleStatus] : 'Pending Payment';
  const paymentStatus = (dto.paymentStatus in PAYMENT_STATUS_MAP) ? PAYMENT_STATUS_MAP[dto.paymentStatus as SalePaymentStatus] : 'Pending';
  const paymentMethod = (dto.payment.method in PAYMENT_METHOD_MAP) ? PAYMENT_METHOD_MAP[dto.payment.method as SalePaymentMethod] : 'Cash';

  const items: ChannelOrderLine[] = (dto.items ?? []).map((item) => {
    const unitPricePaise = toPaise(item.unitPrice);
    const lineTotalPaise = toPaise(item.lineTotal);
    return {
      name: item.name,
      grade: item.grade,
      batch: 'BTH-ACTIVE',
      qtyText: `${item.qtyKg} KG @ ₹${formatPaise(unitPricePaise)}`,
      pricePerUnit: unitPricePaise / 100,
      lineTotal: lineTotalPaise / 100,
    };
  });

  return {
    id: dto.id,
    customerName: dto.buyer.name,
    customerCode: dto.buyer.customerCode ?? undefined,
    channel: dto.channel === 'DIRECT' ? 'Direct Sale' : 'Market Sale',
    dateText: dto.createdAt ? dto.createdAt.slice(0, 10) : '',
    amount: totalPaise / 100,
    status,
    paymentStatus,
    paymentMethod,
    itemCountText: `${dto.items.length} Items`,
    invoiceNo: dto.invoiceNumber ?? undefined,
    warehouseId: dto.warehouseId,
    items,
    totalPaise,
    subtotalPaise,
    gstPaise,
    changeGivenPaise,
  };
}

export interface MappedSaleListItem extends SaleRecord {
  totalPaise: number;
}

export function mapSaleListItem(dto: SaleListItemDto): MappedSaleListItem {
  const totalPaise = toPaise(dto.total);
  const status = (dto.status in SALE_STATUS_MAP) ? SALE_STATUS_MAP[dto.status as SaleStatus] : 'Pending Payment';
  const paymentMethod = (dto.paymentMethod in PAYMENT_METHOD_MAP) ? PAYMENT_METHOD_MAP[dto.paymentMethod as SalePaymentMethod] : 'Cash';

  return {
    id: dto.id,
    customerName: dto.buyer.name,
    customerCode: dto.buyer.customerCode ?? undefined,
    channel: dto.channel === 'DIRECT' ? 'Direct Sale' : 'Market Sale',
    dateText: dto.createdAt ? dto.createdAt.slice(0, 10) : '',
    amount: totalPaise / 100,
    status,
    paymentMethod,
    itemCountText: `${dto.itemCount} Items`,
    invoiceNo: dto.invoiceNumber ?? undefined,
    warehouseId: dto.warehouseId,
    totalPaise,
  };
}

export interface MappedMarketDayAllocation {
  productId: string;
  name: string;
  grade: string;
  allocatedGrams: number;
  soldGrams: number;
  remainingGrams: number;
}

export interface MappedSalesMarketDay {
  date: string;
  warehouseId: string | null;
  revenuePaise: number;
  allocation: MappedMarketDayAllocation[];
  items: MappedSaleListItem[];
}

export function mapSalesMarketDay(dto: SalesMarketDayDto): MappedSalesMarketDay {
  const revenuePaise = toPaise(dto.totals.revenue);
  const allocation = dto.allocation.map((a) => ({
    productId: a.productId,
    name: a.name,
    grade: a.grade,
    allocatedGrams: parseKgToGrams(String(a.allocatedQtyKg)) ?? 0,
    soldGrams: parseKgToGrams(String(a.soldQtyKg)) ?? 0,
    remainingGrams: parseKgToGrams(String(a.remainingQtyKg)) ?? 0,
  }));
  const items = (dto.items ?? []).map(mapSaleListItem);

  return {
    date: dto.date,
    warehouseId: dto.warehouseId,
    revenuePaise,
    allocation,
    items,
  };
}

export interface MappedChannelOrderItem extends ChannelOrderItem {
  totalPaise: number;
}

export function mapChannelOrderListItem(dto: ChannelOrderListItemDto): MappedChannelOrderItem {
  const totalPaise = toPaise(dto.total);
  const status = CHANNEL_ORDER_STATUS_MAP[dto.status] ?? 'Pending';

  return {
    id: dto.id,
    channel: dto.channel,
    businessName: dto.businessName ?? 'Direct Client',
    customerCode: dto.customerCode ?? 'CUS-CH',
    status,
    itemCountText: `${dto.itemCount} Items`,
    dateText: dto.placedAt ? dto.placedAt.slice(0, 10) : '',
    amount: totalPaise / 100,
    totalPaise,
  };
}
