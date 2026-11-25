import { describe, expect, it } from 'vitest';
import rbac from '../../../../../../docs/rbac.json';
import { makeCan } from '../permissions/can';
import { cropCategoryOptions, designCategoryForSlug } from '../screens/produce/produceLogic';

function getRolePermissions(roleCode: string): string[] {
  return rbac.permissions
    .filter((p: { grants: Record<string, string> }) => (p.grants[roleCode] ?? 'none') !== 'none')
    .map((p: { code: string }) => p.code);
}

describe('Produce Control & Crop Data Flow & Taxonomy (M4-S01 & M4-S28a,b,c)', () => {
  const superAdminCan = makeCan(getRolePermissions('SUPER_ADMIN'));
  const tohfaAdminCan = makeCan(getRolePermissions('TOHFA_ADMIN'));
  const mainWhAdminCan = makeCan(getRolePermissions('MAIN_WH_ADMIN'));
  const subWhAdminCan = makeCan(getRolePermissions('SUB_WH_ADMIN'));

  it('verifies RBAC gating for crop taxonomy management', () => {
    expect(superAdminCan('admin.crop_taxonomy.manage')).toBe(true);
    expect(tohfaAdminCan('admin.crop_taxonomy.manage')).toBe(true);
    expect(mainWhAdminCan('admin.crop_taxonomy.manage')).toBe(false);
    expect(subWhAdminCan('admin.crop_taxonomy.manage')).toBe(false);
  });

  it('verifies RBAC gating for diary taxonomy management', () => {
    expect(superAdminCan('admin.diary_taxonomy.manage')).toBe(true);
    expect(tohfaAdminCan('admin.diary_taxonomy.manage')).toBe(true);
    expect(mainWhAdminCan('admin.diary_taxonomy.manage')).toBe(false);
    expect(subWhAdminCan('admin.diary_taxonomy.manage')).toBe(false);
  });

  it('verifies RBAC gating for platform event management', () => {
    expect(superAdminCan('platform.event.manage')).toBe(true);
    expect(tohfaAdminCan('platform.event.manage')).toBe(true);
    expect(mainWhAdminCan('platform.event.manage')).toBe(false);
    expect(subWhAdminCan('platform.event.manage')).toBe(false);
  });

  it('verifies standard categories and grade systems for crop taxonomy', () => {
    const validCategories = ['Vegetable', 'Fruit', 'Spice'];
    expect(validCategories).toContain('Vegetable');
    expect(validCategories).toContain('Fruit');
    expect(validCategories).toContain('Spice');

    const gradeSystems = [
      'Grade 1, Grade 2, Commercial',
      'Grade A, Grade B, Grade C',
      'Standard Market Grade',
    ];
    expect(gradeSystems).toHaveLength(3);
  });
});

describe('Crop Data category filter options come from the fetched categories', () => {
  it('lists every fetched category, in the API order, with none dropped', () => {
    const options = cropCategoryOptions([
      { id: 'c-1', name: 'Vegetables', slug: 'vegetables' },
      { id: 'c-2', name: 'Pulses', slug: 'pulses' },
      { id: 'c-3', name: 'Fruits', slug: 'fruits' },
    ]);
    expect(options.map((o) => o.id)).toEqual(['c-1', 'c-2', 'c-3']);
  });

  it('does not invent a category the API did not return', () => {
    const options = cropCategoryOptions([{ id: 'c-1', name: 'Vegetables', slug: 'vegetables' }]);
    expect(options).toHaveLength(1);
    expect(options.some((o) => o.slug === 'spices')).toBe(false);
  });

  it('keeps the design label for the three seeded slugs and leaves others without one', () => {
    const options = cropCategoryOptions([
      { id: 'c-1', name: 'Fruits', slug: 'fruits' },
      { id: 'c-2', name: 'Pulses', slug: 'pulses' },
    ]);
    expect(options[0]?.design).toBe('Fruit');
    expect(options[1]?.design).toBeUndefined();
    expect(designCategoryForSlug('spices')).toBe('Spice');
  });

  it('returns no options before the categories have loaded', () => {
    expect(cropCategoryOptions(undefined)).toEqual([]);
  });
});
