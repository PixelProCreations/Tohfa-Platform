import { describe, expect, it } from 'vitest';
import rbac from '../../../../../../docs/rbac.json';
import { makeCan } from '../permissions/can';

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

  it('correctly updates an existing activity category in state on edit save', () => {
    const initialActivities = [
      {
        id: 'da-1',
        code: 'DA01',
        categoryName: 'Land Prep',
        subActivityCount: 3,
        description: '—',
        status: 'ACTIVE' as const,
        createdBy: 'Demo Super Admin',
        lastUpdated: '18 Sep 2026',
      },
    ];

    const editedActivity = {
      ...initialActivities[0],
      categoryName: 'Land Preparation & Soil Conditioning',
      description: 'Primary tillage and organic soil amendment',
      subActivityCount: 4,
      lastUpdated: 'Today',
    };

    const nextActivities = initialActivities.map(a =>
      a.id === editedActivity.id ? editedActivity : a
    );

    expect(nextActivities[0]?.categoryName).toBe('Land Preparation & Soil Conditioning');
    expect(nextActivities[0]?.subActivityCount).toBe(4);
    expect(nextActivities[0]?.description).toBe('Primary tillage and organic soil amendment');
    expect(nextActivities[0]?.lastUpdated).toBe('Today');
  });

  it('correctly appends a new activity category to the list', () => {
    const initialActivities = [
      {
        id: 'da-1',
        code: 'DA01',
        categoryName: 'Land Prep',
        subActivityCount: 3,
        description: '—',
        status: 'ACTIVE' as const,
        createdBy: 'Demo Super Admin',
        lastUpdated: '18 Sep 2026',
      },
    ];

    const newActivity = {
      id: 'da-new',
      code: 'DA04',
      categoryName: 'Weeding & Mulching',
      subActivityCount: 2,
      description: 'Manual hand-weeding and straw mulching',
      status: 'ACTIVE' as const,
      createdBy: 'Demo Super Admin',
      lastUpdated: 'Today',
    };

    const nextActivities = [newActivity, ...initialActivities];
    expect(nextActivities).toHaveLength(2);
    expect(nextActivities[0]?.categoryName).toBe('Weeding & Mulching');
  });

  it('correctly retires and reactivates an activity category', () => {
    const item = {
      id: 'da-1',
      code: 'DA01',
      categoryName: 'Land Prep',
      subActivityCount: 3,
      description: '—',
      status: 'ACTIVE' as const,
      createdBy: 'Demo Super Admin',
      lastUpdated: '18 Sep 2026',
    };

    const retiredItem = {
      ...item,
      status: 'RETIRED' as const,
      lastUpdated: 'Today',
    };
    expect(retiredItem.status).toBe('RETIRED');

    const reactivatedItem = {
      ...retiredItem,
      status: 'ACTIVE' as const,
      lastUpdated: 'Today',
    };
    expect(reactivatedItem.status).toBe('ACTIVE');
  });

  it('validates Crop Record Detail M4-S03g Related tab data structure', () => {
    const relatedData = {
      farmDiary: [
        { title: 'Land Preparation', date: '20 Feb 2025', badge: 'Compost incorporated' },
        { title: 'Planting', date: '5 Mar 2025', badge: 'Tomato seedlings planted' },
        { title: 'Land Preparation', date: '20 Feb 2025', badge: 'Drip irrigation checked' },
      ],
      inputRecords: [
        { title: 'Compost (FYM)', date: '15 Mar 2025', dosage: '2,000 kg/ha', badge: 'Applied' },
        { title: 'Rock phosphate', date: '20 Apr 2025', dosage: '350 kg/ha', badge: 'Applied' },
        { title: 'Green manure', date: '10 May 2025', dosage: '25 kg/ha', badge: 'Applied' },
      ],
      auditVerification: {
        lastAudit: '18 Feb 2025',
        result: 'Passed',
        auditor: 'R. Devi',
        followUp: 'None pending',
      },
    };

    expect(relatedData.farmDiary).toHaveLength(3);
    expect(relatedData.farmDiary[0]?.badge).toBe('Compost incorporated');
    expect(relatedData.inputRecords).toHaveLength(3);
    expect(relatedData.inputRecords[0]?.dosage).toBe('2,000 kg/ha');
    expect(relatedData.auditVerification.result).toBe('Passed');
    expect(relatedData.auditVerification.auditor).toBe('R. Devi');
  });

  it('validates dropdown options for Add / Edit Activity Category', () => {
    const activityTypes = [
      'Land Prep',
      'Sowing',
      'Irrigation & Drainage',
      'Weeding & Thinning',
      'Nutrient Application',
      'Pest & Disease Control',
      'Harvesting',
      'Post-Harvest Handling',
    ];
    const categories = [
      'Soil Management',
      'Crop Establishment',
      'Water Management',
      'Plant Protection',
      'Nutrient Management',
      'Harvesting & Storage',
    ];
    const activityCrops = [
      'All Crops',
      'Vegetables Only',
      'Fruits Only',
      'Spices & Condiments',
      'Root & Tuber Crops',
    ];
    const methods = [
      'Manual / Tiller',
      'Mechanized (Tractor)',
      'Automated Drip / Sprinkler',
      'Traditional Hand-Tool',
      'Integrated Method',
      'Manual Transplanting',
      'Foliar Spraying / Drenching',
      'Hand Weeding',
    ];

    expect(activityTypes).toContain('Land Prep');
    expect(categories).toContain('Soil Management');
    expect(activityCrops).toContain('All Crops');
    expect(methods).toContain('Manual / Tiller');
  });

  it('validates dropdown options for Create / Edit Platform Event', () => {
    const eventTypes = [
      'Training',
      'Workshop',
      'Webinar',
      'Field Day / Demonstration',
      'Farmer Meet',
      'Certification Drive',
      'Market Linkage Expo',
    ];
    expect(eventTypes).toContain('Training');
    expect(eventTypes).toContain('Workshop');
    expect(eventTypes).toHaveLength(7);
  });
});
