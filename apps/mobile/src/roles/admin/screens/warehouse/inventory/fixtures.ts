/**
 * Design-sample data for the inventory screens (design module M3), moved out
 * of the screens unchanged so the screens can be wired to the API one by one
 * (API integration plan, "Pattern for every module phase"). Display strings
 * are exactly what the design shows; nothing here is real stock.
 */
import type {
  AdjustmentHistoryItem,
  LowStockItem,
  SampleAllocation,
  SampleBatchDetail,
  SampleBatchListItem,
  SampleInventoryTotals,
  SampleLedgerMovement,
  SampleProductStockDetail,
  SampleStockItem,
  SampleTopStockProduct,
  StockBatchItem,
} from './types';

/** M3S01: the KPI tiles. */
export const SAMPLE_INVENTORY_TOTALS: SampleInventoryTotals = {
  totalAvailable: '1,245 KG',
  available: '1,245 KG',
  reserved: '320 KG',
  allocated: '580 KG',
  lowStockCount: '05',
  verificationPending: '02',
};

/** M3S01: "Top Stock Products". A low-stock card opens Low Stock instead of the product. */
export const SAMPLE_TOP_STOCK_PRODUCTS: readonly SampleTopStockProduct[] = [
  { name: 'Tomato', grade: 'Grade 1', lowStock: false, available: '245 KG', reserved: '50 KG', allocated: '120 KG' },
  { name: 'Carrot', grade: 'Grade 1', lowStock: false, available: '180 KG', reserved: '20 KG', allocated: '80 KG' },
  { name: 'Beans', grade: 'Grade 1', lowStock: true, available: '95 KG', reserved: '10 KG', allocated: '30 KG' },
];

/** M3S02: the stock list. */
export const SAMPLE_STOCK_ITEMS: readonly SampleStockItem[] = [
  { name: 'Tomato', grade: 'Grade 1', status: 'Healthy Stock', available: '245 KG', reserved: '50 KG', allocated: '120 KG' },
  { name: 'Carrot', grade: 'Grade 1', status: 'Low Stock', available: '12 KG', reserved: '0 KG', allocated: '0 KG' },
  { name: 'Beetroot', grade: 'Grade 1', status: 'Healthy Stock', available: '60 KG', reserved: '5 KG', allocated: '15 KG' },
  { name: 'Spinach', grade: 'Grade 2', status: 'Out of Stock', available: '0 KG', reserved: '0 KG', allocated: '0 KG' },
];

/** M3S03: one product's stock. */
export const SAMPLE_PRODUCT_STOCK_DETAIL: SampleProductStockDetail = {
  name: 'Tomato',
  grade: 'Grade 1',
  available: '245 KG',
  reserved: '50 KG',
  allocated: '120 KG',
  online: '120 KG',
  liveMarket: '40 KG',
  reserve: '50 KG',
  buffer: '30 KG',
  activeBatches: '5',
  storageLocations: '3',
  primaryStorage: 'Cold Storage · Section A · Rack 03',
};

/** M3S04: the batches of one product. */
export const SAMPLE_BATCH_LIST: readonly SampleBatchListItem[] = [
  {
    id: 'BAT-2026-00124',
    product: 'Tomato',
    grade: 'Grade 1',
    status: 'Active',
    available: '95 KG',
    storage: 'Cold Storage · A03',
    dateText: 'Received 24 Sep 2026',
  },
  {
    id: 'BAT-2026-00125',
    product: 'Tomato',
    grade: 'Grade 1',
    status: 'Active',
    available: '150 KG',
    storage: 'Cold Storage · A04',
    dateText: 'Received 24 Sep 2026',
  },
  {
    id: 'BAT-2026-00098',
    product: 'Tomato',
    grade: 'Grade 1',
    status: 'Active',
    available: '0 KG',
    storage: 'Cold Storage · A01',
    dateText: 'Fully consumed',
  },
];

/** M3S05: one batch. */
export const SAMPLE_BATCH_DETAIL: SampleBatchDetail = {
  batchCode: 'BAT-2026-00124',
  product: 'Tomato',
  grade: 'Grade 1',
  status: 'Active',
  storageLocation: 'Cold Storage · A03',
  receivedQty: '100 KG',
  availableQty: '95 KG',
  receivedDate: '24 Sep 2026',
  goodsReceipt: 'GR-1024',
  sourceFarmer: 'Internal reference',
  movementReceived: '100 KG',
  movementDispatched: '20 KG',
  movementReserved: '10 KG',
};

/** M3S06: the cross-warehouse batch list (absorbed Main StockLedgerScreen). */
export const SAMPLE_STOCK_BATCHES: readonly StockBatchItem[] = [
  { id: '1', name: 'Carrots', quantityKg: 240, batchId: 'BT-4471', zone: 'Zone A-2', receivedDate: 'Received Sep 9' },
  { id: '2', name: 'Cabbage', quantityKg: 180, batchId: 'BT-4460', zone: 'Zone B-1', receivedDate: 'Received Sep 7' },
  { id: '3', name: 'Beetroot', quantityKg: 95, batchId: 'BT-4452', zone: 'Zone A-3', receivedDate: 'Received Sep 5' },
];

/** M3S06: the four ledger cards, one per movement kind the design shows. */
export const SAMPLE_LEDGER_MOVEMENTS = {
  receipt: {
    type: 'RECEIPT',
    quantity: '+100 KG',
    product: 'Tomato · Grade 1',
    batch: 'BAT-2026-00124',
    time: '24 Sep · 10:54 AM',
    ref: 'GR-1024',
    balance: '100 KG',
  },
  dispatch: {
    type: 'DISPATCH',
    quantity: '-20 KG',
    product: 'Tomato · Grade 1',
    order: 'ORD-10242',
    time: '24 Sep · 02:30 PM',
    balance: '80 KG',
  },
  allocation: {
    type: 'ALLOCATION_ONLINE',
    quantity: '20 KG',
    product: 'Tomato · Grade 1',
    time: '24 Sep · 02:32 PM',
  },
  reservation: {
    type: 'RESERVATION_HOLD',
    quantity: '10 KG',
    product: 'Tomato · Grade 1',
    order: 'ORD-10245',
    time: '24 Sep · 03:10 PM',
  },
} as const satisfies Record<string, SampleLedgerMovement>;

/** M3S07: the four channel cards, in the design's order (ONLINE, LIVE MARKET, RESERVE, BUFFER). */
export const SAMPLE_ALLOCATIONS: readonly SampleAllocation[] = [
  { channel: 'ONLINE', allocated: '420 KG', consumed: '180 KG', reserved: '120 KG', available: '120 KG' },
  { channel: 'LIVE MARKET', allocated: '120 KG', consumed: '40 KG', reserved: '30 KG', available: '50 KG' },
  { channel: 'RESERVE', allocated: '80 KG', consumed: '20 KG', reserved: '20 KG', available: '40 KG' },
  { channel: 'BUFFER', allocated: '60 KG', consumed: '10 KG', reserved: '10 KG', available: '40 KG' },
];

/** M3S09: the low-stock rows. */
export const SAMPLE_LOW_STOCK_ITEMS: readonly LowStockItem[] = [
  { name: 'Carrot — Grade 1', available: '12 KG', threshold: '20 KG' },
  { name: 'Beans — Grade 1', available: '8 KG', threshold: '15 KG' },
  { name: 'Spinach — Grade 2', available: '0 KG', threshold: '10 KG' },
  { name: 'Beetroot — Grade 1', available: '6 KG', threshold: '12 KG' },
  { name: 'Cow Milk', available: '4 L', threshold: '10 L' },
];

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
