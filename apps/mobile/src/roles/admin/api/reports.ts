/**
 * Warehouse reports API (docs/openapi.yaml tag Reports):
 *   GET /admin/reports/sales        order.list.view_all           (BR-64; requires from & to)
 *   GET /admin/reports/receiving    inventory.goods_receipt.record (BR-64; requires from & to)
 *   GET /admin/reports/inventory    inventory.batch.view          (BR-64; snapshot)
 *   GET /admin/reports/returns      rma.request.process           (BR-64; requires from & to)
 *   GET /admin/reports/customers    customer.list.view            (BR-64; counts only, requires from & to)
 *   GET /admin/reports/cash-topups  wallet.cash_topup.process     (BR-64; requires from & to)
 *
 * Money and quantities stay as the API's decimal strings (`Money`, `Quantity`);
 * the screens' mappers turn them into integer paise and grams.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import { adminGet } from './http';

export type Quantity = string;
export type ReportChannel = 'ONLINE' | 'MARKET' | 'HORECA' | 'B2B' | 'DIRECT';

export interface ReportDayCountDto {
  date: string;
  count: number;
}

export interface ReportDayCountTotalDto {
  date: string;
  count: number;
  total: Money | string;
}

export interface SalesReportChannelRowDto {
  channel: ReportChannel;
  count: number;
  total: Money | string;
}

export interface SalesReportStatusRowDto {
  status: string;
  count: number;
}

export interface SalesReportDto {
  from: string;
  to: string;
  warehouseId: string | null;
  count: number;
  total: Money | string;
  averageOrderValue: Money | string;
  byDay: ReportDayCountTotalDto[];
  byChannel: SalesReportChannelRowDto[];
  byStatus: SalesReportStatusRowDto[];
}

export interface ReceivingReportDayRowDto {
  date: string;
  status: string;
  count: number;
}

export interface ReceivingReportDto {
  from: string;
  to: string;
  warehouseId: string | null;
  byDay: ReceivingReportDayRowDto[];
}

export interface InventoryReportItemDto {
  cropId: string;
  name: string;
  totalQty: Quantity | string;
  batchCount: number;
}

export interface InventoryReportDto {
  from: string | null;
  to: string | null;
  warehouseId: string | null;
  items: InventoryReportItemDto[];
}

export interface ReturnsReportStatusRowDto {
  status: string;
  count: number;
}

export interface ReturnsReportDto {
  from: string;
  to: string;
  warehouseId: string | null;
  byStatus: ReturnsReportStatusRowDto[];
  byDay: ReportDayCountDto[];
  refundedTotal: Money | string;
}

export interface CustomersReportDto {
  from: string;
  to: string;
  warehouseId: string | null;
  customersWithOrders: number;
  newCustomers: number;
  byDay: ReportDayCountDto[];
}

export interface CashTopupsReportDto {
  from: string;
  to: string;
  warehouseId: string | null;
  count: number;
  total: Money | string;
  byDay: ReportDayCountTotalDto[];
}

export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
  'WAREHOUSE_SCOPE_VIOLATION',
  'WAREHOUSE_REQUIRED',
] as const;

export interface SalesReportQuery {
  from: string;
  to: string;
  warehouseId?: string | undefined;
  channel?: ReportChannel | undefined;
}

export interface DateWarehouseReportQuery {
  from: string;
  to: string;
  warehouseId?: string | undefined;
}

export interface InventoryReportQuery {
  from?: string | undefined;
  to?: string | undefined;
  warehouseId?: string | undefined;
}

export function getSalesReport(query: SalesReportQuery, signal?: AbortSignal): Promise<SalesReportDto> {
  return adminGet<SalesReportDto>(
    '/admin/reports/sales',
    {
      from: query.from,
      to: query.to,
      warehouseId: query.warehouseId,
      channel: query.channel,
    },
    signal,
  );
}

export function getReceivingReport(query: DateWarehouseReportQuery, signal?: AbortSignal): Promise<ReceivingReportDto> {
  return adminGet<ReceivingReportDto>(
    '/admin/reports/receiving',
    {
      from: query.from,
      to: query.to,
      warehouseId: query.warehouseId,
    },
    signal,
  );
}

export function getInventoryReport(query: InventoryReportQuery = {}, signal?: AbortSignal): Promise<InventoryReportDto> {
  return adminGet<InventoryReportDto>(
    '/admin/reports/inventory',
    {
      from: query.from,
      to: query.to,
      warehouseId: query.warehouseId,
    },
    signal,
  );
}

export function getReturnsReport(query: DateWarehouseReportQuery, signal?: AbortSignal): Promise<ReturnsReportDto> {
  return adminGet<ReturnsReportDto>(
    '/admin/reports/returns',
    {
      from: query.from,
      to: query.to,
      warehouseId: query.warehouseId,
    },
    signal,
  );
}

export function getCustomersReport(query: DateWarehouseReportQuery, signal?: AbortSignal): Promise<CustomersReportDto> {
  return adminGet<CustomersReportDto>(
    '/admin/reports/customers',
    {
      from: query.from,
      to: query.to,
      warehouseId: query.warehouseId,
    },
    signal,
  );
}

export function getCashTopupsReport(query: DateWarehouseReportQuery, signal?: AbortSignal): Promise<CashTopupsReportDto> {
  return adminGet<CashTopupsReportDto>(
    '/admin/reports/cash-topups',
    {
      from: query.from,
      to: query.to,
      warehouseId: query.warehouseId,
    },
    signal,
  );
}
