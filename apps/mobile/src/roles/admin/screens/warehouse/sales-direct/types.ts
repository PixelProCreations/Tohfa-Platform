/**
 * Shared types for the B2B / HORECA channel sales screens.
 *
 * These screens used to exist twice (SubWarehouseB2B* and SubWarehouseHoreca*),
 * identical apart from mock data and labels. One screen per purpose now takes a
 * `channel` prop; the per-channel copy and mock data live in fixtures.ts.
 */

/** The direct-sales channel a screen is showing. */
export type SalesChannel = 'B2B' | 'HORECA';

/** One product line of a channel order. */
export interface ChannelOrderLine {
  name: string;
  grade: string;
  batch: string;
  qtyText: string;
  pricePerUnit: number;
  lineTotal: number;
}

/** One B2B or HORECA order (mock data today; the real list returns the same shape). */
export interface ChannelOrderItem {
  id: string;
  channel: SalesChannel;
  businessName: string;
  customerCode: string;
  status: 'Processing' | 'Pending' | 'Completed' | 'Confirmed';
  itemCountText: string;
  dateText: string;
  amount: number;
  /** Warehouse that fulfils the order. Falls back to the viewer's scope when absent. */
  warehouseName?: string | undefined;
  items?: ChannelOrderLine[] | undefined;
}
