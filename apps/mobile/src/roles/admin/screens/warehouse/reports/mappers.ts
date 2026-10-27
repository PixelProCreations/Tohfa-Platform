import { parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import type {
  CashTopupsReportDto,
  CustomersReportDto,
  InventoryReportDto,
  ReceivingReportDto,
  ReturnsReportDto,
  SalesReportDto,
} from '../../../api/reports';

export function moneyStringToPaise(val: Money | string | null | undefined): number {
  if (!val) return 0;
  try {
    return toPaise(parseMoney(String(val)));
  } catch {
    return 0;
  }
}

export function mapSalesReportDto(dto: SalesReportDto) {
  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    count: dto.count,
    totalPaise: moneyStringToPaise(dto.total),
    averageOrderValuePaise: moneyStringToPaise(dto.averageOrderValue),
    byDay: dto.byDay,
    byChannel: dto.byChannel,
    byStatus: dto.byStatus,
  };
}

export function mapInventoryReportDto(dto: InventoryReportDto) {
  return {
    warehouseId: dto.warehouseId,
    totalItems: dto.items.length,
    items: dto.items.map((item) => ({
      ...item,
      totalQtyGrams: Math.round(parseFloat(item.totalQty || '0') * 1000),
    })),
  };
}

export function mapReceivingReportDto(dto: ReceivingReportDto) {
  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    byDay: dto.byDay,
    totalReceipts: dto.byDay.reduce((sum, d) => sum + d.count, 0),
  };
}

export function mapReturnsReportDto(dto: ReturnsReportDto) {
  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    byDay: dto.byDay,
    byStatus: dto.byStatus,
    totalReturns: dto.byStatus.reduce((sum, r) => sum + r.count, 0),
    refundedTotalPaise: moneyStringToPaise(dto.refundedTotal),
  };
}

export function mapCustomersReportDto(dto: CustomersReportDto) {
  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    customersWithOrders: dto.customersWithOrders,
    newCustomers: dto.newCustomers,
    byDay: dto.byDay,
  };
}

export function mapCashTopupsReportDto(dto: CashTopupsReportDto) {
  return {
    from: dto.from,
    to: dto.to,
    warehouseId: dto.warehouseId,
    count: dto.count,
    totalPaise: moneyStringToPaise(dto.total),
    byDay: dto.byDay,
  };
}
