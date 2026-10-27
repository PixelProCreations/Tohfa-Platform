/**
 * Pure mapper functions for the storage-ops area.
 * No React, no network: plain-Node vitest.
 * Tests written first (CLAUDE.md 2.6); they FAIL until mappers.ts exists.
 */
import { describe, expect, it } from 'vitest';
import type { StorageLocationDto } from '../api/warehouses';
import {
  storageTypeOf,
  toStorageLocationItem,
} from '../screens/warehouse/storage-ops/mappers';

// ─── fixtures ─────────────────────────────────────────────────────────────────

const COLD_LOC: StorageLocationDto = {
  id: 'loc-001',
  warehouseId: 'wh-ooty',
  code: 'CS-A01',
  name: 'Cold Storage A',
  locationType: 'Cold Storage',
  capacityKg: '2000.000',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: null,
};

const DRY_LOC: StorageLocationDto = {
  id: 'loc-002',
  warehouseId: 'wh-ooty',
  code: 'DS-B01',
  name: 'Dry Storage B',
  locationType: 'Dry Storage',
  capacityKg: '1500.000',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: null,
};

const NULL_TYPE_LOC: StorageLocationDto = {
  id: 'loc-003',
  warehouseId: 'wh-ooty',
  code: 'SA-C01',
  name: 'Staging Area C',
  locationType: null,
  capacityKg: null,
  isActive: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: null,
};

// ─── storageTypeOf ────────────────────────────────────────────────────────────

describe('storageTypeOf', () => {
  it('maps "Cold Storage" exactly', () => {
    expect(storageTypeOf('Cold Storage')).toBe('Cold Storage');
  });

  it('maps "Dry Storage" exactly', () => {
    expect(storageTypeOf('Dry Storage')).toBe('Dry Storage');
  });

  it('maps "Bulk Storage" exactly', () => {
    expect(storageTypeOf('Bulk Storage')).toBe('Bulk Storage');
  });

  it('maps "Staging Area" exactly', () => {
    expect(storageTypeOf('Staging Area')).toBe('Staging Area');
  });

  it('case-insensitive: "cold storage" → "Cold Storage"', () => {
    expect(storageTypeOf('cold storage')).toBe('Cold Storage');
  });

  it('case-insensitive: "DRY STORAGE" → "Dry Storage"', () => {
    expect(storageTypeOf('DRY STORAGE')).toBe('Dry Storage');
  });

  it('falls back to "Dry Storage" for unknown free text', () => {
    expect(storageTypeOf('Ambient Room')).toBe('Dry Storage');
  });

  it('falls back to "Dry Storage" for null', () => {
    expect(storageTypeOf(null)).toBe('Dry Storage');
  });
});

// ─── toStorageLocationItem ────────────────────────────────────────────────────

describe('toStorageLocationItem', () => {
  it('maps id, warehouseId, code, name', () => {
    const r = toStorageLocationItem(COLD_LOC);
    expect(r.id).toBe('loc-001');
    expect(r.warehouseId).toBe('wh-ooty');
    expect(r.code).toBe('CS-A01');
    expect(r.name).toBe('Cold Storage A');
  });

  it('maps locationType to StorageType', () => {
    const r = toStorageLocationItem(COLD_LOC);
    expect(r.type).toBe('Cold Storage');
  });

  it('maps capacityKg string to number', () => {
    const r = toStorageLocationItem(COLD_LOC);
    expect(r.capacityKg).toBeCloseTo(2000, 0);
  });

  it('maps null capacityKg to 0', () => {
    const r = toStorageLocationItem(NULL_TYPE_LOC);
    expect(r.capacityKg).toBe(0);
  });

  it('maps isActive:true to "Active"', () => {
    const r = toStorageLocationItem(COLD_LOC);
    expect(r.status).toBe('Active');
  });

  it('maps isActive:false to "Inactive"', () => {
    const r = toStorageLocationItem(NULL_TYPE_LOC);
    expect(r.status).toBe('Inactive');
  });

  it('currentKg is 0 (spec-gap: no per-location stock endpoint)', () => {
    const r = toStorageLocationItem(COLD_LOC);
    expect(r.currentKg).toBe(0);
  });

  it('maps null locationType to "Dry Storage" fallback', () => {
    const r = toStorageLocationItem(NULL_TYPE_LOC);
    expect(r.type).toBe('Dry Storage');
  });

  it('maps Dry Storage locationType', () => {
    const r = toStorageLocationItem(DRY_LOC);
    expect(r.type).toBe('Dry Storage');
  });
});
