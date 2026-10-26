/**
 * screens/warehouse/warehouse-admin/overviewFigures.ts: the near-full capacity
 * tone shared by the Main dashboard's Warehouse Overview cards (D01 brief bars,
 * D02 Warehouse Overview). Ported with the Dev lineage's tests (PR #139); the
 * near-full limit is the server's (system_config via CAPACITY_NEAR_FULL),
 * never a client constant (root CLAUDE.md 2.7).
 */
import { describe, expect, it } from 'vitest';
import type { AlertItemDto } from '../api/alerts';
import { capacityTone, capacityToneInputOf, nearFullSignal, nearFullSignalOf } from '../screens/warehouse/warehouse-admin/overviewFigures';

const OOTY = '11111111-1111-4111-8111-111111111111';
const COON = '22222222-2222-4222-8222-222222222222';
const KOTA = '33333333-3333-4333-8333-333333333333';

function nearFullAlert(warehouseId: string, params: AlertItemDto['params'] = {}): AlertItemDto {
  return {
    itemKey: `CAPACITY_NEAR_FULL:${warehouseId}`,
    type: 'CAPACITY_NEAR_FULL',
    messageKey: 'alert.capacity_near_full.message',
    refType: 'WAREHOUSE',
    refId: warehouseId,
    warehouseId,
    since: null,
    params,
    state: 'ACTIVE',
    snoozedUntil: null,
  };
}


describe('BR-77 / BR-66: the near-full state comes from the server, never from a client threshold', () => {
  it('a warehouse with a CAPACITY_NEAR_FULL alert is near full', () => {
    const signal = nearFullSignal([nearFullAlert(OOTY)]);
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: 5000, availableGrams: 1 }, signal)).toBe('nearFull');
  });

  it("without an alert or a server threshold, no utilization makes a card near full (the old 75% / 90% bands are gone)", () => {
    const signal = nearFullSignal([]);
    expect(signal.thresholdBp).toBeNull();
    for (const bp of [7500, 9000, 9999]) {
      expect(capacityTone({ warehouseId: COON, utilizationBp: bp, availableGrams: 1 }, signal)).toBe('neutral');
    }
  });

  it("applies the alert's own thresholdPercent to the other warehouses (one the caller dismissed still shows)", () => {
    const signal = nearFullSignal([nearFullAlert(OOTY, { thresholdPercent: 90, utilizationPercent: 93.1 })]);
    expect(signal.thresholdBp).toBe(9000);
    expect(capacityTone({ warehouseId: COON, utilizationBp: 9000, availableGrams: 1 }, signal)).toBe('nearFull');
    expect(capacityTone({ warehouseId: COON, utilizationBp: 8999, availableGrams: 1 }, signal)).toBe('neutral');
  });

  it('reads a decimal-string threshold, and ignores alerts of other types', () => {
    const low: AlertItemDto = { ...nearFullAlert(KOTA, { thresholdKg: '50.000' }), type: 'LOW_STOCK', itemKey: 'LOW_STOCK:x' };
    const signal = nearFullSignal([low, nearFullAlert(OOTY, { thresholdPercent: '85.5' })]);
    expect(signal.thresholdBp).toBe(8550);
    expect(signal.warehouseIds.has(KOTA)).toBe(false);
  });

  it('two different thresholds are not guessed between: only the alerts themselves count', () => {
    const signal = nearFullSignal([nearFullAlert(OOTY, { thresholdPercent: 90 }), nearFullAlert(COON, { thresholdPercent: 80 })]);
    expect(signal.thresholdBp).toBeNull();
    expect(capacityTone({ warehouseId: KOTA, utilizationBp: 9500, availableGrams: 1 }, signal)).toBe('neutral');
  });

  it('over capacity is a fact (available below zero, BR-66b) and needs no threshold', () => {
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: 10001, availableGrams: -1 }, null)).toBe('over');
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: 10000, availableGrams: 0 }, null)).toBe('neutral');
  });

  it('alerts not loaded yet, or no capacity set: neutral, never a claim', () => {
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: 9900, availableGrams: 1 }, null)).toBe('neutral');
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: null, availableGrams: null }, nearFullSignal([]))).toBe('neutral');
  });

  it('a list cut short by the page cap gives no signal (a missing alert would read as "not near full")', () => {
    expect(nearFullSignalOf(undefined)).toBeNull();
    expect(nearFullSignalOf({ items: [nearFullAlert(OOTY)], complete: false })).toBeNull();
    expect(nearFullSignalOf({ items: [nearFullAlert(OOTY)], complete: true })?.warehouseIds.has(OOTY)).toBe(true);
  });

  it('reads the tone input from GET /warehouses/{id}/capacity: basis points and grams, nothing clamped (BR-66b)', () => {
    expect(
      capacityToneInputOf({ warehouseId: OOTY, capacityKg: '1000.000', usedKg: '1200.500', availableKg: '-200.500', utilizationPercent: 120.05 }),
    ).toEqual({ warehouseId: OOTY, utilizationBp: 12005, availableGrams: -200500 });
    expect(capacityToneInputOf({ warehouseId: OOTY, capacityKg: null, usedKg: '5.000', availableKg: null, utilizationPercent: null })).toEqual({
      warehouseId: OOTY,
      utilizationBp: null,
      availableGrams: null,
    });
  });
});
