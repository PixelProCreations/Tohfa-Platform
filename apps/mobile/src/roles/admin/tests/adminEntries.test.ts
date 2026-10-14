import { describe, expect, it } from 'vitest';
import { isTranslationKey } from '../i18n';
import { ADMIN_ENTRIES } from '../navigation/adminEntries';
import { WAREHOUSE_FEATURES, isWarehouseFeatureVisible } from '../screens/warehouse/availability';
import { createAdminCan } from '../rbac/permissions';

describe('admin home entries', () => {
  it('have unique ids, real features and real catalogue keys', () => {
    const ids = ADMIN_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of ADMIN_ENTRIES) {
      expect(Object.keys(WAREHOUSE_FEATURES)).toContain(entry.feature);
      expect(isTranslationKey(entry.titleKey)).toBe(true);
      expect(isTranslationKey(entry.hintKey)).toBe(true);
    }
  });

  it('show invoices only to an admin holding invoice.view_own', () => {
    const visible = (perms: string[]) =>
      ADMIN_ENTRIES.filter((e) => isWarehouseFeatureVisible(e.feature, createAdminCan(perms))).map(
        (e) => e.id,
      );
    expect(visible(['invoice.view_own'])).toContain('invoices');
    expect(visible([])).not.toContain('invoices');
  });
  it('show profile and warehouse info to a Sub Warehouse Admin, and neither without the grants', () => {
    const visible = (perms: string[]) =>
      ADMIN_ENTRIES.filter((e) => isWarehouseFeatureVisible(e.feature, createAdminCan(perms))).map(
        (e) => e.id,
      );
    expect(visible(['auth.principal.view_own', 'warehouse.own.view'])).toEqual(
      expect.arrayContaining(['profile', 'warehouseInfo']),
    );
    expect(visible([])).not.toContain('profile');
    expect(visible([])).not.toContain('warehouseInfo');
  });

  it('BR-61: show returns to an admin holding rma.request.process (the queue read code), and not without it', () => {
    const visible = (perms: string[]) =>
      ADMIN_ENTRIES.filter((e) => isWarehouseFeatureVisible(e.feature, createAdminCan(perms))).map(
        (e) => e.id,
      );
    expect(visible(['rma.request.process'])).toContain('returns');
    expect(visible(['rma.refund.approve', 'rma.refund.wallet_process'])).not.toContain('returns');
    expect(ADMIN_ENTRIES.find((e) => e.id === 'returns')?.feature).toBe('returns');
  });
});
