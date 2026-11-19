/**
 * The Inventory Filters screen's (M3S16) pure logic: the option lists and the
 * filter itself, over rows the host already loaded.
 *
 * Every option list comes from real values: grades from the openapi `Grade`
 * enum, stock levels from `StockLevel`, and products, batches and storage
 * locations from the movement / batch rows the host passed. Nothing is sample
 * data, so with no rows the lists are empty and the screen shows its dash.
 *
 * Stock level is a product fact, not a movement fact: a movement matches a
 * level only through the product rows (ProductStock.level, which is "low" only
 * when the server raised a LOW_STOCK alert). Without product rows a level
 * filter matches nothing rather than guessing.
 */
import type { Grade } from '../../../api/inventory';
import { productKey, productLabelOf } from './mappers';
import type { BatchRow, ProductStock, StockLevel, StockMovementRow } from './types';

/** docs/openapi.yaml `Grade`, in its order. */
export const FILTER_GRADES: readonly Grade[] = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'];

/** `StockLevel`, in the design's order (Available, Low Stock, Out of Stock). */
export const FILTER_LEVELS: readonly StockLevel[] = ['inStock', 'low', 'out'];

/** The screen's selection. undefined = "All" / nothing picked. */
export interface InventoryFilterCriteria {
  search: string;
  /** productKey(cropId, grade). */
  productKey?: string | undefined;
  grade?: Grade | undefined;
  level?: StockLevel | undefined;
  /** BatchRow.id (the batch uuid). */
  batchId?: string | undefined;
  storageLocation?: string | undefined;
}

export const EMPTY_FILTER_CRITERIA: InventoryFilterCriteria = { search: '' };

export interface FilterOption {
  value: string;
  label: string;
}

function sortedByLabel(map: Map<string, string>): FilterOption[] {
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Products (crop + grade) named by the loaded movements, batches and product rows. */
export function productOptions(
  movements: readonly StockMovementRow[],
  batches: readonly BatchRow[],
  products: readonly ProductStock[],
): FilterOption[] {
  const map = new Map<string, string>();
  for (const p of products) map.set(p.key, productLabelOf(p.productName, p.grade));
  for (const b of batches) map.set(productKey(b.cropId, b.grade), productLabelOf(b.productName, b.grade));
  for (const m of movements) {
    if (m.cropId !== undefined && m.grade !== undefined && m.productName !== undefined) {
      map.set(productKey(m.cropId, m.grade), productLabelOf(m.productName, m.grade));
    }
  }
  return sortedByLabel(map);
}

/** Batches by uuid, labelled with their human code. */
export function batchOptions(movements: readonly StockMovementRow[], batches: readonly BatchRow[]): FilterOption[] {
  const map = new Map<string, string>();
  for (const b of batches) map.set(b.id, b.batchCode);
  for (const m of movements) if (m.batchCode !== undefined) map.set(m.batchId, m.batchCode);
  return sortedByLabel(map);
}

/** Distinct storage locations the server recorded. */
export function locationOptions(movements: readonly StockMovementRow[], batches: readonly BatchRow[]): FilterOption[] {
  const map = new Map<string, string>();
  for (const b of batches) if (b.storageLocation !== null) map.set(b.storageLocation, b.storageLocation);
  for (const m of movements) if (m.storageLocation !== undefined) map.set(m.storageLocation, m.storageLocation);
  return sortedByLabel(map);
}

function movementProductKey(m: StockMovementRow): string | undefined {
  return m.cropId !== undefined && m.grade !== undefined ? productKey(m.cropId, m.grade) : undefined;
}

/**
 * The movements that match every chosen criterion. A row that does not carry
 * the field a criterion needs (its batch was not loaded) does not match it.
 */
export function filterMovements(
  movements: readonly StockMovementRow[],
  criteria: InventoryFilterCriteria,
  products: readonly ProductStock[] = [],
): StockMovementRow[] {
  const levels = new Map(products.map((p) => [p.key, p.level]));
  const query = criteria.search.trim().toLowerCase();
  return movements.filter((m) => {
    const key = movementProductKey(m);
    if (criteria.productKey !== undefined && key !== criteria.productKey) return false;
    if (criteria.grade !== undefined && m.grade !== criteria.grade) return false;
    if (criteria.level !== undefined && (key === undefined || levels.get(key) !== criteria.level)) return false;
    if (criteria.batchId !== undefined && m.batchId !== criteria.batchId) return false;
    if (criteria.storageLocation !== undefined && m.storageLocation !== criteria.storageLocation) return false;
    if (query !== '') {
      const haystack = [m.productName, m.batchCode].filter((s): s is string => s !== undefined).join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
