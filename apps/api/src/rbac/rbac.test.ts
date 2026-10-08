/**
 * Table-driven RBAC assertions against docs/rbac.json.
 *
 * WHY: docs/rbac.json is edited by humans and by agents. These cases pin the
 * grants that carry real financial or governance weight, so an accidental
 * widening ("just give TOHFA_ADMIN the fair price") fails CI instead of
 * shipping.
 *
 * HOW TO GROW THIS FILE: add a row to `GRANT_CASES`. Do not add a new
 * `it(...)` block — the table is the test. One row per (permission, role) pair
 * that a requirement or the role matrix states explicitly.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { loadRbac } from './loadRbac.js';
import { resolveScope, scopedWhere } from './requirePermission.js';
import { IDS, aFarmerAdmin, aSubWarehouseAdmin, anActor } from '../test/factories.js';

interface GrantCase {
  permission: string;
  role: RoleCode;
  expected: ScopeLevel;
  /** Why this grant matters — quoted from the requirement where possible. */
  because: string;
}

const GRANT_CASES: readonly GrantCase[] = [
  // --- Fair price: Super Admin only. The whole pricing model rests on this. ---
  {
    permission: 'pricing.fair_price.set',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Only the Super Admin may set the fair price ceiling.',
  },
  {
    permission: 'pricing.fair_price.set',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'TOHFA Admin explicitly cannot set the fair price ceiling.',
  },
  {
    permission: 'pricing.fair_price.set',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Elected farmer admins have no pricing authority.',
  },
  {
    permission: 'pricing.fair_price.bulk_update',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin can bulk update fair price ceilings.',
  },
  {
    permission: 'pricing.fair_price.bulk_update',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'TOHFA Admin explicitly cannot bulk update fair price ceilings.',
  },
  {
    permission: 'pricing.retail_price.set',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin can set retail prices.',
  },
  {
    permission: 'pricing.retail_price.set',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'TOHFA Admin can set retail prices.',
  },
  {
    permission: 'pricing.fair_price.view',
    role: RoleCode.FARMER,
    expected: ScopeLevel.VIEW,
    because: 'Farmers must see the ceiling to price a listing, but cannot change it.',
  },

  // --- Listing approval: conditional for Farmer Admin (never their own). ---
  {
    permission: 'listing.approve',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.CONDITIONAL,
    because: 'Farmer Admins approve peer listings but never their own (NOT_OWN_LISTING).',
  },
  {
    permission: 'listing.approve',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Warehouse staff have no listing-approval authority.',
  },
  {
    permission: 'listing.approve',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'A farmer cannot approve any listing, including their own.',
  },

  // --- Warehouse scope: Sub Warehouse Admin is confined to its own warehouse. ---
  {
    permission: 'inventory.stock_ledger.view_own',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.OWN,
    because: 'Sub Warehouse Admin sees only its assigned warehouse ledger.',
  },
  {
    permission: 'inventory.stock_ledger.view_all',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Cross-warehouse ledger access is Main Warehouse Admin and above.',
  },
  {
    permission: 'inventory.stock_adjustment.approve',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'A Sub Warehouse Admin cannot approve its own stock adjustments.',
  },
  {
    permission: 'transfer.inter_warehouse.initiate',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Inter-warehouse transfers are initiated by Main Warehouse Admin / Super Admin only.',
  },
  {
    permission: 'warehouse.all.view',
    role: RoleCode.MAIN_WH_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Main Warehouse Admin oversees all four warehouses.',
  },
  {
    permission: 'upload.signed_url.create',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.ALL,
    because: 'Every authenticated role (including customer) can request signed upload targets.',
  },
  {
    permission: 'farmer.profile.view_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers may view their own farmer profile, farms, and zone assignment (BR-36).',
  },
  {
    permission: 'certification.manage_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers may create and manage their own PGS/NPOP certification records (BR-02).',
  },
  {
    permission: 'certification.mark_verified',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin and TOHFA Admin may verify/unverify certifications manually (BR-02b).',
  },
  {
    permission: 'certification.mark_verified',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'Farmers cannot verify their own certificates under any circumstance (BR-02).',
  },
  {
    permission: 'certification.view',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin and TOHFA Admin may list and view any certification ahead of a verify decision (matrix §9).',
  },
  {
    permission: 'certification.view',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Farmer Admin has no certification admin role; only Super Admin/TOHFA Admin manage certifications.',
  },
  {
    permission: 'certification.view',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'Farmers read their own certifications through certification.manage_own, not the admin-wide read.',
  },
  // --- BR-51: admin edit/remove of any farmer's certificate. A spec gap with a
  // conservative default (rbac.json conflicts); every widening must fail here. ---
  {
    permission: 'certification.manage_any',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: "Super Admin may correct or remove any farmer's certificate record (BR-51; same grants as certification.view).",
  },
  {
    permission: 'certification.manage_any',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.ALL,
    because: "TOHFA Admin may correct or remove any farmer's certificate record (BR-51; same grants as certification.view).",
  },
  {
    permission: 'certification.manage_any',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Farmer Admin has no certification admin role; own-zone editing is an open client question, not a grant.',
  },
  {
    permission: 'certification.manage_any',
    role: RoleCode.MAIN_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Warehouse admins have no authority over farmer certification records.',
  },
  {
    permission: 'certification.manage_any',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Warehouse admins have no authority over farmer certification records.',
  },
  {
    permission: 'certification.manage_any',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: "Farmers edit only their own certificates (certification.manage_own, BR-49/BR-50), never another farmer's.",
  },
  {
    permission: 'certification.manage_any',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'Customers never see or touch certification records (BR-16).',
  },
  {
    permission: 'farmer.bank_account.manage_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers manage their own payout bank accounts and UPI destinations (BR-53).',
  },
  {
    permission: 'farmer.bank_account.manage_own',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'Customers do not hold farmer bank accounts.',
  },
  {
    permission: 'farmer.bank_account.view',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin can view farmer bank accounts for verification and payout review.',
  },
  {
    permission: 'farmer.bank_account.view',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'Farmers access bank accounts through farmer.bank_account.manage_own, not admin-wide view.',
  },
  {
    permission: 'farmer.documents.view_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers view their own profile documents (BR-54).',
  },
  {
    permission: 'farmer.documents.view_own',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'Customers do not hold farmer profile documents (BR-16).',
  },
  {
    permission: 'farmer.tree_planting.manage_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers manage their own tree plantings (BR-55).',
  },
  {
    permission: 'farmer.tree_planting.manage_own',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'Customers do not plant trees (BR-16).',
  },
  {
    permission: 'farmer.crop_input.manage_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers manage their own crop inputs (BR-56).',
  },
  {
    permission: 'farmer.crop_input.manage_own',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'Customers do not log crop inputs (BR-16).',
  },
  {
    permission: 'farmer.crop_milestone.manage_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers manage milestone progress on own crops (BR-57).',
  },
  {
    permission: 'farmer.crop_milestone.manage_own',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'Customers do not track crop milestones (BR-16).',
  },
  {
    permission: 'farmer.calendar.view_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'Farmers view their own consolidated calendar (BR-58).',
  },
  {
    permission: 'farmer.calendar.view_own',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'Customers do not view farmer operational calendars (BR-16).',
  },
  {
    permission: 'platform.event.manage',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin manages platform calendar events and announcements (BR-58).',
  },
  {
    permission: 'platform.event.manage',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'Farmers cannot create platform-wide calendar events (BR-58).',
  },
  {
    permission: 'notification.own.view',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.ALL,
    because: 'All authenticated users can view their own in-app notifications (BR-36).',
  },
  {
    permission: 'notification.own.mark_read',
    role: RoleCode.FARMER,
    expected: ScopeLevel.ALL,
    because: 'Users can mark their own notifications as read (BR-36).',
  },
  // --- Cash Top-up: Super, TOHFA, Main and Sub WH Admins may process; Farmer Admin cannot ---
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin can process cash top-ups.',
  },
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'TOHFA Admin can process cash top-ups.',
  },
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.MAIN_WH_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Main Warehouse Admin can process cash top-ups.',
  },
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.SUB_WH_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Sub Warehouse Admin can process cash top-ups.',
  },
  {
    permission: 'wallet.cash_topup.process',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Farmer Admin has no cash top-up authority.',
  },
  {
    permission: 'wallet.cash_topup.fiscal_tag',
    role: RoleCode.MAIN_WH_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Main Warehouse Admin can record fiscal cash tags.',
  },
  {
    permission: 'wallet.cash_topup.fiscal_tag',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Farmer Admin has no fiscal tag authority.',
  },

  // --- Farm rating (BR-06): read-only. farmer.rating.edit was REMOVED on ---
  // --- 2026-10-01 (ratings come from completed INTERNAL audits only), so  ---
  // --- its three rows went with it; farm-ratings.test.ts asserts that no  ---
  // --- farm-rating write permission exists in docs/rbac.json.             ---
  {
    permission: 'farmer.rating.view',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'A farmer may see their own farm rating.',
  },
  {
    permission: 'farmer.rating.view',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'The customer view is farm-anonymous (BR-16); customers never see a farm rating.',
  },
  {
    permission: 'farmer.rating.configure_tiers',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Only the Super Admin may edit rating_tier_config bands (BR-04).',
  },
  {
    permission: 'farmer.rating.configure_tiers',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'TOHFA Admin cannot configure rating tier thresholds.',
  },

  // --- Audit Management (BR-03, BR-05, BR-36). audit.view and
  //     audit.red_flag.manage were added by the audit-module contract. ---
  {
    permission: 'audit.view',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'Super Admin sees every audit.',
  },
  {
    permission: 'audit.view',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'TOHFA Admin runs the audit programme and sees every audit.',
  },
  {
    permission: 'audit.view',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.CONDITIONAL,
    because: 'A Farmer Admin sees audits only for farmers in their own zone (OWN_ZONE_ONLY).',
  },
  {
    permission: 'audit.view',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'BR-36: a farmer sees only their own audit history.',
  },
  {
    permission: 'audit.view',
    role: RoleCode.MAIN_WH_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Warehouse admins have no audit visibility.',
  },
  {
    permission: 'audit.view',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'BR-16: audits identify farms; customers never see them.',
  },
  {
    permission: 'audit.schedule',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Reqs 6.1: only Super Admin / TOHFA Admin schedule audits.',
  },
  {
    permission: 'audit.score.categories',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'Matrix §9: a Farmer Admin may not score audit categories (SUPPORT_ONLY).',
  },
  {
    permission: 'audit.red_flag.manage',
    role: RoleCode.TOHFA_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'BR-05b: red flags are raised/cleared by an explicit admin action.',
  },
  {
    permission: 'audit.red_flag.manage',
    role: RoleCode.FARMER_ADMIN,
    expected: ScopeLevel.NONE,
    because: 'A Farmer Admin cannot red-flag a farm.',
  },
  {
    permission: 'audit.red_flag.manage',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'A farmer can never touch their own red flag.',
  },
  {
    permission: 'audit.report.generate',
    role: RoleCode.FARMER,
    expected: ScopeLevel.VIEW,
    because: 'A farmer may download (GET only) the report PDF of their own audit.',
  },
  {
    permission: 'farmer.learning.view',
    role: RoleCode.FARMER,
    expected: ScopeLevel.ALL,
    because: 'BR-59: Farmers can view all published learning articles, videos, and trainings.',
  },
  {
    permission: 'farmer.learning.view',
    role: RoleCode.CUSTOMER,
    expected: ScopeLevel.NONE,
    because: 'BR-59: Customers do not access the farmer learning hub.',
  },
  {
    permission: 'farmer.learning.participate_own',
    role: RoleCode.FARMER,
    expected: ScopeLevel.OWN,
    because: 'BR-59: Farmers manage own enrollments and group memberships.',
  },
  {
    permission: 'learning.admin.manage',
    role: RoleCode.SUPER_ADMIN,
    expected: ScopeLevel.ALL,
    because: 'BR-59: Super Admin manages learning hub content.',
  },
  {
    permission: 'learning.admin.manage',
    role: RoleCode.FARMER,
    expected: ScopeLevel.NONE,
    because: 'BR-59: Farmers cannot manage learning hub content.',
  },
];

describe('docs/rbac.json grants', () => {
  const rbac = loadRbac();

  it.each(GRANT_CASES)(
    '$permission for $role is "$expected" — $because',
    ({ permission, role, expected }) => {
      expect(rbac.grantFor(permission, role)).toBe(expected);
    },
  );

  it('declares every role code the platform knows about', () => {
    const declared = new Set(rbac.document.roles.map((r) => r.code));
    for (const code of Object.values(RoleCode)) {
      expect(declared.has(code)).toBe(true);
    }
  });

  it('references only predicates that are defined', () => {
    for (const permission of rbac.document.permissions) {
      if (permission.predicate === undefined) continue;
      expect(
        rbac.predicate(permission.predicate),
        `permission ${permission.code} references undefined predicate ${permission.predicate}`,
      ).toBeDefined();
    }
  });

  it('grants Super Admin something for every permission it is listed on', () => {
    for (const permission of rbac.document.permissions) {
      expect(
        permission.grants[RoleCode.SUPER_ADMIN],
        `permission ${permission.code} has no SUPER_ADMIN grant`,
      ).toBeDefined();
    }
  });

  it('exhaustively checks all 5 admin roles on every permission in docs/rbac.json (S-39 matrix conformance)', () => {
    const adminRoles = [
      RoleCode.SUPER_ADMIN,
      RoleCode.TOHFA_ADMIN,
      RoleCode.FARMER_ADMIN,
      RoleCode.MAIN_WH_ADMIN,
      RoleCode.SUB_WH_ADMIN,
    ];

    for (const perm of rbac.document.permissions) {
      for (const role of adminRoles) {
        const grant = rbac.grantFor(perm.code, role);
        expect(
          [ScopeLevel.ALL, ScopeLevel.OWN, ScopeLevel.CONDITIONAL, ScopeLevel.VIEW, ScopeLevel.NONE],
          `Permission ${perm.code} for role ${role} returned invalid scope ${grant}`,
        ).toContain(grant);
      }
    }
  });
});

describe('resolveScope', () => {
  it('returns null when no role grants the permission', () => {
    const farmerOnly = anActor({ roles: [{ code: RoleCode.FARMER }], farmerId: IDS.farmer });
    expect(resolveScope(farmerOnly, 'pricing.fair_price.set')).toBeNull();
  });

  it('picks the highest scope across multiple roles', () => {
    const dualRole = anActor({
      roles: [{ code: RoleCode.FARMER }, { code: RoleCode.SUPER_ADMIN }],
      farmerId: IDS.farmer,
    });
    expect(resolveScope(dualRole, 'pricing.fair_price.set')?.level).toBe(ScopeLevel.ALL);
  });

  it('carries the predicate through for a conditional grant', () => {
    const scope = resolveScope(aFarmerAdmin(), 'listing.approve');
    expect(scope?.level).toBe(ScopeLevel.CONDITIONAL);
    expect(scope?.predicate).toBe('NOT_OWN_LISTING');
  });

  it('carries the actor warehouse assignment into the scope', () => {
    const scope = resolveScope(aSubWarehouseAdmin(), 'inventory.stock_ledger.view_own');
    expect(scope?.level).toBe(ScopeLevel.OWN);
    expect(scope?.warehouseIds).toEqual([IDS.warehouseOoty]);
  });
});

describe('scopedWhere', () => {
  it('is unrestricted for "all"', () => {
    const scope = resolveScope(anActor(), 'warehouse.all.view');
    expect(scope).not.toBeNull();
    const filter = scopedWhere(scope!, { warehouseColumn: 'w.id' });
    expect(filter.sql).toBe('TRUE');
  });

  it('filters by warehouse for an "own" Sub Warehouse Admin scope', () => {
    const scope = resolveScope(aSubWarehouseAdmin(), 'inventory.stock_ledger.view_own');
    const filter = scopedWhere(scope!, { warehouseColumn: 'b.warehouse_id', startIndex: 3 });
    expect(filter.sql).toBe('(b.warehouse_id = ANY($3::uuid[]))');
    expect(filter.params).toEqual([[IDS.warehouseOoty]]);
    expect(filter.nextIndex).toBe(4);
  });

  it('still confines a conditional Farmer Admin to its own zones', () => {
    const scope = resolveScope(aFarmerAdmin(), 'listing.approve');
    const filter = scopedWhere(scope!, { zoneColumn: 'f.zone_id' });
    expect(filter.sql).toContain('f.zone_id = ANY($1::uuid[])');
    expect(filter.params).toEqual([[IDS.zoneNorth]]);
  });
});
