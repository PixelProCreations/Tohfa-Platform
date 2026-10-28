/**
 * Pure mapper functions for the Main warehouse-admin screens.
 * No React, no network: plain-Node vitest.
 * Tests written first (CLAUDE.md 2.6); they FAIL until mappers.ts exists.
 */
import { describe, expect, it } from 'vitest';
import type { AlertType } from '../api/alerts';
import type { WarehouseDto, WarehouseCapacityDto } from '../api/warehouses';
import type { SubAdminDto } from '../api/subAdmins';
import {
  toWarehouseAdminRow,
  toSubWarehouseAdminItem,
  nearFullFromAlerts,
} from '../screens/warehouse/warehouse-admin/mappers';

// ─── fixtures ─────────────────────────────────────────────────────────────────

const WH: WarehouseDto = {
  id: 'wh-ooty',
  code: 'WH-OOT-001',
  name: 'Ooty Warehouse',
  type: 'MAIN',
  address: 'Charing Cross, Ooty',
  city: 'Ooty',
  pincode: '643001',
  latitude: null,
  longitude: null,
  capacityKg: '4200.000',
  contactPhone: null,
  operatingHours: null,
  isMarketDayVenue: false,
  marketDayOfWeek: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const CAPACITY: WarehouseCapacityDto = {
  warehouseId: 'wh-ooty',
  capacityKg: '4200.000',
  usedKg: '3420.000',
  availableKg: '780.000',
  utilizationPercent: 81.43,
};

const SUB_ADMIN: SubAdminDto = {
  userId: 'swa-001',
  adminCode: 'SWA-001',
  fullName: 'Arun Kumar',
  status: 'ACTIVE',
  warehouseId: 'wh-ooty',
  assignedAt: '2026-01-01T00:00:00.000Z',
};

// ─── toWarehouseAdminRow ──────────────────────────────────────────────────────

describe('toWarehouseAdminRow', () => {
  it('maps warehouse id', () => {
    const r = toWarehouseAdminRow(WH, CAPACITY, false);
    expect(r.warehouseId).toBe('wh-ooty');
  });

  it('maps code from WarehouseDto', () => {
    const r = toWarehouseAdminRow(WH, CAPACITY, false);
    expect(r.code).toBe('WH-OOT-001');
  });

  it('maps city', () => {
    const r = toWarehouseAdminRow(WH, CAPACITY, false);
    expect(r.city).toBe('Ooty');
  });

  it('maps MAIN type to "Main Warehouse"', () => {
    const r = toWarehouseAdminRow(WH, CAPACITY, false);
    expect(r.kind).toBe('Main Warehouse');
  });

  it('maps SUB type to "Sub Warehouse"', () => {
    const r = toWarehouseAdminRow({ ...WH, type: 'SUB' }, CAPACITY, false);
    expect(r.kind).toBe('Sub Warehouse');
  });

  it('maps stockKg from usedKg', () => {
    const r = toWarehouseAdminRow(WH, CAPACITY, false);
    expect(r.stockKg).toBeCloseTo(3420, 0);
  });

  it('maps capacityKg', () => {
    const r = toWarehouseAdminRow(WH, CAPACITY, false);
    expect(r.capacityKg).toBeCloseTo(4200, 0);
  });

  it('status is "Active" when not near-full', () => {
    const r = toWarehouseAdminRow(WH, CAPACITY, false);
    expect(r.status).toBe('Active');
  });

  it('status is "Near Capacity" when near-full alert is set', () => {
    const r = toWarehouseAdminRow(WH, CAPACITY, true);
    expect(r.status).toBe('Near Capacity');
  });
});

// ─── toSubWarehouseAdminItem ──────────────────────────────────────────────────

describe('toSubWarehouseAdminItem', () => {
  it('uses userId as id', () => {
    const r = toSubWarehouseAdminItem(SUB_ADMIN);
    expect(r.id).toBe('swa-001');
  });

  it('maps fullName to name', () => {
    const r = toSubWarehouseAdminItem(SUB_ADMIN);
    expect(r.name).toBe('Arun Kumar');
  });

  it('maps warehouseId', () => {
    const r = toSubWarehouseAdminItem(SUB_ADMIN);
    expect(r.warehouseId).toBe('wh-ooty');
  });

  it('maps ACTIVE status to "Active"', () => {
    const r = toSubWarehouseAdminItem(SUB_ADMIN);
    expect(r.status).toBe('Active');
  });

  it('maps PENDING status to "Pending"', () => {
    const r = toSubWarehouseAdminItem({ ...SUB_ADMIN, status: 'PENDING' });
    expect(r.status).toBe('Pending');
  });
});

// ─── nearFullFromAlerts ───────────────────────────────────────────────────────

describe('nearFullFromAlerts', () => {
  it('returns false when alerts is undefined', () => {
    expect(nearFullFromAlerts(undefined, 'wh-ooty')).toBe(false);
  });

  it('returns true when CAPACITY_NEAR_FULL alert exists for the warehouse', () => {
    const alerts = [{ warehouseId: 'wh-ooty', type: 'CAPACITY_NEAR_FULL' as AlertType }];
    expect(nearFullFromAlerts(alerts, 'wh-ooty')).toBe(true);
  });

  it('returns false when CAPACITY_NEAR_FULL alert is for another warehouse', () => {
    const alerts = [{ warehouseId: 'wh-coon', type: 'CAPACITY_NEAR_FULL' as AlertType }];
    expect(nearFullFromAlerts(alerts, 'wh-ooty')).toBe(false);
  });
});
