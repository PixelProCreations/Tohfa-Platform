/**
 * Design-sample data for the inventory screens that have no API yet (design
 * module M3). The read-only screens are live (InventoryFlow); what remains here
 * backs the stock-adjustment screens, which are hidden until the server has
 * routes for them (availability.ts). Nothing here is real stock.
 */
import type { AdjustmentHistoryItem } from './types';

/** M3S14: the adjustment history. */
export const SAMPLE_ADJUSTMENTS: readonly AdjustmentHistoryItem[] = [
  {
    id: 'ADJ-000128',
    status: 'Pending Approval',
    statusKey: 'Pending',
    product: 'Tomato · Grade 1 · -5 KG · 16 Sep 2026, 2:30 PM',
  },
  {
    id: 'ADJ-000119',
    status: 'Approved',
    statusKey: 'Approved',
    product: 'Beans · Grade 1 · -2 KG · 15 Sep 2026, 4:10 PM',
  },
  {
    id: 'ADJ-000103',
    status: 'Rejected',
    statusKey: 'Rejected',
    product: 'Beetroot · Grade 1 · -8 KG · 10 Sep 2026, 11:05 AM',
  },
];
