/**
 * roles/admin/screens/warehouse/reports/mappers.ts:
 * Domain mappers between OpenAPI DTOs and warehouse reports UI types (BR-64).
 *
 * Rules:
 *   - Money is NEVER a float. Every amount is integer paise (BR-64).
 *   - Quantities are integer grams (parseKgToGrams / gramsToKgString).
 *   - Scoping: Sub Warehouse Admin is confined to its assigned warehouse (BR-30, BR-64).
 *   - Date range validation: from and to are required (from <= to) for date-bounded reports.
 *   - The API's warehouseId is a uuid or absent: an old fixture id ('WH-OOTY') is a 400,
 *     so a non-uuid selection means "all of the caller's warehouses" (BR-64a, BR-64b).
 */
import type { Paise } from '@tohfa/shared-types';
import type {
  CashTopupsReportDto,
  CustomersReportDto,
  InventoryReportDto,
  ReceivingReportDto,
  ReportChannel,
  ReportDayCountDto,
  ReturnsReportDto,
  ReturnsReportStatusRowDto,
  SalesReportDto,
} from '../../../api/reports';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';
import { gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import { hasKey, t } from '../../../i18n';
import type { WarehouseScope } from '../finance-expenses';
import { uuidOrUndefined } from '../finance-expenses/mappers';
import type { ReportPreset } from './types';

const toPaise = (v: string | number | null | undefined): Paise => {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  return parseRupeesToPaise(String(v)) ?? 0;
};

/**
 * Validates report date range (BR-64).
 * Both dates must be non-empty strings and from <= to.
 */
export function validateReportDateRange(from: string, to: string): boolean {
  if (!from || !to) return false;
  return from <= to;
}

/**
 * Calculates start and end YYYY-MM-DD dates in Asia/Kolkata day for report presets (BR-64).
 */
export function getReportPresetDates(
  preset: ReportPreset,
  now = new Date(),
): { from: string; to: string } {
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  const year = istNow.getUTCFullYear();
  const month = String(istNow.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istNow.getUTCDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (preset === 'Today') {
    return { from: todayStr, to: todayStr };
  }
  if (preset === 'Week') {
    const weekAgo = new Date(now.getTime() + istOffsetMs - 6 * 24 * 60 * 60 * 1000);
    const wYear = weekAgo.getUTCFullYear();
    const wMonth = String(weekAgo.getUTCMonth() + 1).padStart(2, '0');
    const wDay = String(weekAgo.getUTCDate()).padStart(2, '0');
    return { from: `${wYear}-${wMonth}-${wDay}`, to: todayStr };
  }
  return { from: `${year}-${month}-01`, to: todayStr };
}

/**
 * The warehouseId a report request carries (BR-30, BR-64a, BR-64b).
 *
 * - Sub (scope.warehouseId set): always its own warehouse; a selection is
 *   ignored. The server confines it again (a foreign id is 404).
 * - Main: the selected warehouse, or undefined for all warehouses.
 *
 * Either way only a uuid is ever sent: anything else (an old 'WH-OOTY' fixture
 * id) becomes undefined, which the server reads as "every warehouse the caller
 * may see", instead of a 400.
 */
export function reportsWarehouseFilter(
  scope: WarehouseScope,
  selectedWarehouseId?: string | undefined,
): string | undefined {
  if (scope.warehouseId !== undefined) {
    return uuidOrUndefined(scope.warehouseId);
  }
  return uuidOrUndefined(selectedWarehouseId);
}

/** Label of an enum code from the reports' status buckets, falling back to the raw code. */
export function reportStatusLabel(kind: 'order' | 'grn' | 'return', status: string): string {
  const key = `reports.status.${kind}.${status}`;
  return hasKey(key) ? t(key) : status;
}

/** Label of a sales channel code, falling back to the raw code. */
export function reportChannelLabel(channel: string): string {
  const key = `reports.channel.${channel}`;
  return hasKey(key) ? t(key) : channel;
}

export interface MappedSalesReportDayRow {
  date: string;
  count: number;
  totalPaise: number;
  totalFormatted: string;
}

export interface MappedSalesReportChannelRow {
  channel: ReportChannel;
  count: number;
  totalPaise: number;
  totalFormatted: string;
}

export interface MappedSalesReportStatusRow {
  status: string;
  count: number;
}

export interface MappedSalesReport {
  from: string;
  to: string;
  warehouseId: string | null;
  count: number;
  totalPaise: number;
  totalFormatted: string;
  averageOrderValuePaise: number;
  averageOrderValueFormatted: string;
  byDay: MappedSalesReportDayRow[];
  byChannel: MappedSalesReportChannelRow[];
  byStatus: MappedSalesReportStatusRow[];
}

export function mapSalesReport(dto: SalesReportDto): MappedSalesReport {
  const totalPaise = toPaise(dto.total);
  const averageOrderValuePaise = toPaise(dto.averageOrderValue);

  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    count: dto.count,
    totalPaise,
    totalFormatted: formatPaise(totalPaise),
    averageOrderValuePaise,
    averageOrderValueFormatted: formatPaise(averageOrderValuePaise),
    byDay: dto.byDay.map((d) => {
      const dayTotalPaise = toPaise(d.total);
      return {
        date: d.date,
        count: d.count,
        totalPaise: dayTotalPaise,
        totalFormatted: formatPaise(dayTotalPaise),
      };
    }),
    byChannel: dto.byChannel.map((c) => {
      const channelTotalPaise = toPaise(c.total);
      return {
        channel: c.channel,
        count: c.count,
        totalPaise: channelTotalPaise,
        totalFormatted: formatPaise(channelTotalPaise),
      };
    }),
    byStatus: dto.byStatus.map((s) => ({
      status: s.status,
      count: s.count,
    })),
  };
}

export interface MappedReceivingReport {
  from: string;
  to: string;
  warehouseId: string | null;
  totalReceipts: number;
  byStatusCounts: Record<string, number>;
  /** grn_status ACCEPTED (whole receipt passed QC). */
  acceptedCount: number;
  /** grn_status REJECTED. */
  rejectedCount: number;
  byDay: ReceivingReportDto['byDay'];
}

export function mapReceivingReport(dto: ReceivingReportDto): MappedReceivingReport {
  let totalReceipts = 0;
  const byStatusCounts: Record<string, number> = {};

  for (const row of dto.byDay) {
    totalReceipts += row.count;
    byStatusCounts[row.status] = (byStatusCounts[row.status] ?? 0) + row.count;
  }

  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    totalReceipts,
    byStatusCounts,
    acceptedCount: byStatusCounts['ACCEPTED'] ?? 0,
    rejectedCount: byStatusCounts['REJECTED'] ?? 0,
    byDay: dto.byDay,
  };
}

export interface MappedInventoryReportItem {
  cropId: string;
  name: string;
  totalQtyGrams: number;
  totalQtyKg: string;
  batchCount: number;
}

export interface MappedInventoryReport {
  from: string | null;
  to: string | null;
  warehouseId: string | null;
  items: MappedInventoryReportItem[];
  totalQtyGrams: number;
  totalQtyKg: string;
  totalBatchCount: number;
}

export function mapInventoryReport(dto: InventoryReportDto): MappedInventoryReport {
  let totalQtyGrams = 0;
  let totalBatchCount = 0;

  const items: MappedInventoryReportItem[] = dto.items.map((item) => {
    const itemGrams = parseKgToGrams(String(item.totalQty)) ?? 0;
    totalQtyGrams += itemGrams;
    totalBatchCount += item.batchCount;
    return {
      cropId: item.cropId,
      name: item.name,
      totalQtyGrams: itemGrams,
      totalQtyKg: gramsToKgString(itemGrams),
      batchCount: item.batchCount,
    };
  });

  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    items,
    totalQtyGrams,
    totalQtyKg: gramsToKgString(totalQtyGrams),
    totalBatchCount,
  };
}

export interface MappedReturnsReport {
  from: string;
  to: string;
  warehouseId: string | null;
  refundedTotalPaise: number;
  refundedTotalFormatted: string;
  totalReturns: number;
  byStatus: ReturnsReportStatusRowDto[];
  byDay: ReportDayCountDto[];
}

export function mapReturnsReport(dto: ReturnsReportDto): MappedReturnsReport {
  const refundedTotalPaise = toPaise(dto.refundedTotal);
  let totalReturns = 0;

  for (const s of dto.byStatus) {
    totalReturns += s.count;
  }

  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    refundedTotalPaise,
    refundedTotalFormatted: formatPaise(refundedTotalPaise),
    totalReturns,
    byStatus: dto.byStatus,
    byDay: dto.byDay,
  };
}

export interface MappedCustomersReport {
  from: string;
  to: string;
  warehouseId: string | null;
  customersWithOrders: number;
  newCustomers: number;
  byDay: ReportDayCountDto[];
}

export function mapCustomersReport(dto: CustomersReportDto): MappedCustomersReport {
  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    customersWithOrders: dto.customersWithOrders,
    newCustomers: dto.newCustomers,
    byDay: dto.byDay,
  };
}

export interface MappedCashTopupsReportDayRow {
  date: string;
  count: number;
  totalPaise: number;
  totalFormatted: string;
}

export interface MappedCashTopupsReport {
  from: string;
  to: string;
  warehouseId: string | null;
  count: number;
  totalPaise: number;
  totalFormatted: string;
  byDay: MappedCashTopupsReportDayRow[];
}

export function mapCashTopupsReport(dto: CashTopupsReportDto): MappedCashTopupsReport {
  const totalPaise = toPaise(dto.total);

  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    count: dto.count,
    totalPaise,
    totalFormatted: formatPaise(totalPaise),
    byDay: dto.byDay.map((d) => {
      const dayTotalPaise = toPaise(d.total);
      return {
        date: d.date,
        count: d.count,
        totalPaise: dayTotalPaise,
        totalFormatted: formatPaise(dayTotalPaise),
      };
    }),
  };
}
