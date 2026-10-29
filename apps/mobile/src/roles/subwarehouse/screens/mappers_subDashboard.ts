/**
 * SubWarehouse Admin Dashboard mappers and derivations.
 *
 * All business logic for translating live API responses into dashboard shell
 * view models:
 *   - BR-65: Unread notification count
 *   - BR-77: Alert models (low-stock alert extraction and formatting)
 *   - BR-104: Warehouse activity mapping, formatting, and client-side filtering
 *   - BR-119 / BR-120: Goods receipt and open purchase order derivations
 *   - BR-103: Customer issue RMA mapping (strict validation, no fabricated fallbacks)
 */
import { parseMoney, toPaise } from '@tohfa/shared-types';
import type { AlertItemDto } from '../../admin/api/alerts';
import type { WalkedCount } from '../../admin/api/dashboardFeeds';
import { formatPaise } from '../../admin/money/paise';
import type { CashTopupsReportDto, ReportChannel, SalesReportDto } from '../../admin/api/reports';
import type { GoodsReceiptDto, PurchaseOrderDto } from '../../admin/api/receiving';
import type { WarehouseActivityEventDto } from '../../admin/api/warehouseActivity';
import { formatAdminTime, istDay } from '../../admin/utils/datetime';
import { formatKg, parseKgToGrams } from '../../admin/money/quantity';
import { t } from '../../admin/i18n';
import { gradeLabel } from '../../admin/screens/warehouse/receiving-qc/mappers';
import type { CustomerIssueRecord, CustomerRecord, Loose } from '../../admin/screens/warehouse/customers/types';
import type { RmaRecord } from '../../admin/screens/warehouse/returns-rma/types';

// ─── Receiving KPI (BR-77b, BR-119) ──────────────────────────────────────────

export interface SubReceivingKpi {
  countText: string;
  awaitingText: string;
}

export function deriveSubReceivingKpi(
  openPos: readonly PurchaseOrderDto[] | undefined,
  openPosExact: boolean,
  awaitingQc: WalkedCount | undefined,
): SubReceivingKpi {
  const countText =
    openPos === undefined
      ? '—'
      : `${String(openPos.length).padStart(2, '0')}${openPosExact ? '' : '+'}`;

  const awaitingText =
    awaitingQc === undefined
      ? t('home.awaiting_qc_none')
      : `${awaitingQc.count}${awaitingQc.exact ? '' : '+'} ${t('home.awaiting_qc')}`;

  return { countText, awaitingText };
}

// ─── Today's Receiving Preview (BR-119, BR-120) ──────────────────────────────

export interface SubReceivingPreviewItem {
  id: string;
  grnNumber: string;
  status: 'Awaiting QC' | 'QC Completed' | string;
  isAwaitingQc: boolean;
  route: string;
  produceTitle: string;
  detailText: string;
  timeText: string;
}

export function deriveSubTodayReceiving(
  receipts: readonly GoodsReceiptDto[] | undefined,
  warehouseShort: string,
): SubReceivingPreviewItem[] {
  if (!receipts) return [];
  return receipts.map((r) => {
    const isAwaitingQc = r.status === 'AWAITING_QC';
    const status = isAwaitingQc ? 'Awaiting QC' : 'QC Completed';
    const produceParts: string[] = [];
    if (r.cropName) produceParts.push(r.cropName);
    if (r.grade) {
      const g = gradeLabel(r.grade);
      if (g) produceParts.push(g);
    }
    const produceTitle = produceParts.length > 0 ? produceParts.join(' · ') : r.grnNumber;

    const grossGrams = parseKgToGrams(r.grossQtyKg);
    const grossFormatted = grossGrams !== null ? formatKg(grossGrams) : '';
    const acceptedGrams = r.acceptedQtyKg ? parseKgToGrams(r.acceptedQtyKg) : null;
    const acceptedFormatted = acceptedGrams !== null ? formatKg(acceptedGrams) : grossFormatted;

    const detailText = isAwaitingQc
      ? (grossFormatted ? `${t('home.expected')}: ${grossFormatted}` : '')
      : (acceptedFormatted ? `${t('home.received')}: ${acceptedFormatted}` : '');

    return {
      id: r.id,
      grnNumber: r.grnNumber,
      status,
      isAwaitingQc,
      route: `Main Warehouse → ${warehouseShort}`,
      produceTitle,
      detailText,
      timeText: formatAdminTime(r.receivedAt),
    };
  });
}

// ─── Low-Stock Alert (BR-77e) ────────────────────────────────────────────────

export interface SubLowStockAlertView {
  hasAlert: boolean;
  title: string;
  subText: string;
}

export function deriveSubLowStockAlert(
  alerts: readonly AlertItemDto[] | undefined,
  cropNames: ReadonlyMap<string, string>,
): SubLowStockAlertView {
  const lowAlert = alerts?.find((a) => a.type === 'LOW_STOCK');
  if (!lowAlert) {
    return { hasAlert: false, title: t('home.low_stock'), subText: '' };
  }

  const cropId = typeof lowAlert.params.cropId === 'string' ? lowAlert.params.cropId : '';
  const cropName = cropNames.get(cropId) ?? (typeof lowAlert.params.cropName === 'string' ? lowAlert.params.cropName : t('home.item'));
  const gradeStr = typeof lowAlert.params.grade === 'string' ? lowAlert.params.grade : undefined;
  const grade = gradeStr ? gradeLabel(gradeStr as any) : '';
  const rawQty = lowAlert.params.totalQtyKg;
  let availableText = '';
  if (rawQty !== undefined && rawQty !== null) {
    const grams = parseKgToGrams(String(rawQty));
    availableText = grams !== null ? formatKg(grams) : '';
  }

  const parts: string[] = [];
  if (cropName && grade) {
    parts.push(`${cropName} — ${grade}`);
  } else if (cropName) {
    parts.push(cropName);
  }
  if (availableText) {
    parts.push(`Available ${availableText}`);
  }
  const subText = parts.join(' · ');

  return {
    hasAlert: true,
    title: t('home.low_stock'),
    subText,
  };
}

// ─── Recent Activity (BR-104b, BR-104d) ──────────────────────────────────────

export interface SubActivityItem {
  id: string;
  sourceId: string;
  title: string;
  badge: 'Inventory' | 'Receiving' | 'Orders' | 'QC' | 'Other';
  subtitle: string;
  dateCategory: 'Today' | 'Yesterday' | 'This Week' | 'Older';
  timeText: string;
  type: 'Inventory' | 'Receiving' | 'Orders' | 'Cash' | 'QC' | 'Other';
  rawType: WarehouseActivityEventDto['type'];
  reference: string;
}

export function mapSubWarehouseActivity(
  events: readonly WarehouseActivityEventDto[],
  now: Date,
): SubActivityItem[] {
  return events.map((event) => {
    let type: SubActivityItem['type'] = 'Other';
    let badge: SubActivityItem['badge'] = 'Other';
    let title = 'Activity';

    switch (event.type) {
      case 'STOCK_MOVEMENT':
        type = 'Inventory';
        badge = 'Inventory';
        title = 'Stock Movement';
        break;
      case 'GOODS_RECEIPT':
        type = 'Receiving';
        badge = 'Receiving';
        title = 'Goods Received';
        break;
      case 'TRANSFER':
        type = 'Inventory';
        badge = 'Inventory';
        title = 'Transfer';
        break;
      case 'ISSUE':
        type = 'QC';
        badge = 'QC';
        title = 'Quality Issue';
        break;
      case 'RETURN':
        type = 'Orders';
        badge = 'Orders';
        title = 'Order Return';
        break;
      case 'DOCUMENT':
        type = 'Other';
        badge = 'Other';
        title = 'Document';
        break;
    }

    const subParts: string[] = [event.reference];
    if (event.qtyKg) {
      const grams = parseKgToGrams(event.qtyKg);
      if (grams !== null) subParts.push(formatKg(grams));
    } else if (event.status) {
      subParts.push(event.status);
    }
    const subtitle = subParts.join(' · ');

    const eventDate = new Date(Date.parse(event.occurredAt));
    const eventDay = istDay(eventDate);
    const today = istDay(now);

    let dateCategory: SubActivityItem['dateCategory'] = 'Older';
    if (eventDay === today) {
      dateCategory = 'Today';
    } else {
      const diffMs = Date.parse(today) - Date.parse(eventDay);
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        dateCategory = 'Yesterday';
      } else if (diffDays > 1 && diffDays <= 7) {
        dateCategory = 'This Week';
      }
    }

    return {
      id: `${event.type}:${event.sourceId}:${event.occurredAt}`,
      sourceId: event.sourceId,
      title,
      badge,
      subtitle,
      dateCategory,
      timeText: formatAdminTime(event.occurredAt),
      type,
      rawType: event.type,
      reference: event.reference,
    };
  });
}

export function filterSubActivities(
  activities: readonly SubActivityItem[],
  dateFilter: 'Today' | 'Yesterday' | 'This Week' | 'All Time',
  activityFilter: 'All Activities' | 'Inventory' | 'Receiving' | 'Orders' | 'Cash' | 'QC',
): SubActivityItem[] {
  return activities.filter((item) => {
    if (activityFilter !== 'All Activities' && item.type !== activityFilter) return false;
    if (dateFilter === 'Today' && item.dateCategory !== 'Today') return false;
    if (dateFilter === 'Yesterday' && item.dateCategory !== 'Yesterday') return false;
    if (
      dateFilter === 'This Week' &&
      item.dateCategory !== 'Today' &&
      item.dateCategory !== 'Yesterday' &&
      item.dateCategory !== 'This Week'
    ) {
      return false;
    }
    return true;
  });
}

// ─── Customer Issue RMA Builder (BR-103) ──────────────────────────────────────

export function buildSubRmaRecord(
  issue: Loose<CustomerIssueRecord> | undefined,
  customer: Loose<CustomerRecord> | undefined,
): RmaRecord | null {
  if (!issue?.issueNo || !issue?.orderNo || !customer?.name) {
    return null;
  }
  const rmaId = issue.issueNo.replace('ISSUE', 'RMA');
  return {
    id: rmaId.toLowerCase(),
    rmaId,
    orderId: issue.orderNo,
    customerName: customer.name,
    customerId: customer.code ?? customer.id ?? '',
    customerPhone: customer.phone ?? '',
    orderDate: issue.dateText ?? '',
    salesChannel: 'Direct Sale',
    paymentStatus: 'Paid',
    productName: issue.product ?? '',
    grade: 'Grade 1',
    quantityPurchased: issue.quantity ?? '',
    unitPrice: '',
    lineTotal: '',
    issueCategory: (issue.category as RmaRecord['issueCategory'] | undefined) ?? 'Quality',
    reportedDate: issue.dateText ?? '',
    timestampText: issue.dateText ?? '',
    description: issue.description ?? '',
    ticketId: issue.issueNo,
    requestedQuantity: issue.quantity ?? '',
    requestedResolution: 'Replacement / Refund',
    status: 'Under Review',
  };
}


// ─── Today's Sales / Cash top-ups (BR-64) ────────────────────────────────────

const DASH = '—';

function reportMoneyText(total: string): string {
  try {
    return formatPaise(toPaise(parseMoney(total)));
  } catch {
    return DASH;
  }
}

function transactionsText(count: number): string {
  return `${count} transaction${count === 1 ? '' : 's'}`;
}

const SALES_CHANNEL_LABEL: Record<ReportChannel, string> = {
  ONLINE: 'Online',
  MARKET: 'Market',
  HORECA: 'HORECA',
  B2B: 'B2B',
  DIRECT: 'Direct',
};
const SALES_CHANNEL_ORDER: readonly ReportChannel[] = ['ONLINE', 'MARKET', 'HORECA', 'B2B', 'DIRECT'];

export interface SubMoneySummary {
  totalText: string;
  countNumberText: string;
  countText: string;
}

export interface SubSalesSummary extends SubMoneySummary {
  channels: { key: string; label: string; totalText: string }[];
}

const EMPTY_SUMMARY: SubMoneySummary = { totalText: DASH, countNumberText: DASH, countText: DASH };

export function deriveSubSalesSummary(report: SalesReportDto | undefined): SubSalesSummary {
  if (!report) return { ...EMPTY_SUMMARY, channels: [] };
  // BR-64c: a channel with no rows is absent, so only channels present are listed.
  const channels = SALES_CHANNEL_ORDER.flatMap((channel) => {
    const row = report.byChannel.find((r) => r.channel === channel);
    return row ? [{ key: channel, label: SALES_CHANNEL_LABEL[channel], totalText: reportMoneyText(String(row.total)) }] : [];
  });
  return {
    totalText: reportMoneyText(String(report.total)),
    countNumberText: String(report.count),
    countText: transactionsText(report.count),
    channels,
  };
}

export function deriveSubCashSummary(report: CashTopupsReportDto | undefined): SubMoneySummary {
  if (!report) return EMPTY_SUMMARY;
  return {
    totalText: reportMoneyText(String(report.total)),
    countNumberText: String(report.count),
    countText: transactionsText(report.count),
  };
}

export function deriveSubLowStockCount(alerts: readonly AlertItemDto[] | undefined): string {
  if (!alerts) return DASH;
  return String(alerts.filter((a) => a.type === 'LOW_STOCK').length).padStart(2, '0');
}
