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
});
