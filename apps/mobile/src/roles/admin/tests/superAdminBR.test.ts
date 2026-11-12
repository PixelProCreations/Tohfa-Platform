import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { makeCan, type Can } from '../permissions/can';

interface RbacFile {
  version: string;
  conflictPrecedence: string;
  conflicts: Array<{ topic: string; precedence: string; decision: string }>;
  permissions: Array<{
    code: string;
    grants: Record<string, string>;
  }>;
}

const RBAC_PATH = path.resolve(__dirname, '../../../../../../docs/rbac.json');
const rbac = JSON.parse(fs.readFileSync(RBAC_PATH, 'utf8')) as RbacFile;

function getPermissionsForRole(roleCode: string): string[] {
  return rbac.permissions
    .filter((p) => (p.grants[roleCode] ?? 'none') !== 'none')
    .map((p) => p.code);
}

describe('Super Admin RBAC & Business Rules (BR-xx)', () => {
  const superAdminCan: Can = makeCan(getPermissionsForRole('SUPER_ADMIN'));
  const tohfaAdminCan: Can = makeCan(getPermissionsForRole('TOHFA_ADMIN'));
  const mainWhAdminCan: Can = makeCan(getPermissionsForRole('MAIN_WH_ADMIN'));
  const subWhAdminCan: Can = makeCan(getPermissionsForRole('SUB_WH_ADMIN'));
  const farmerAdminCan: Can = makeCan(getPermissionsForRole('FARMER_ADMIN'));

  describe('BR-08: Fair price ceiling is set by Super Admin only', () => {
    it('BR-08: grants fair price setting and bulk updating to SUPER_ADMIN only', () => {
      expect(superAdminCan('pricing.fair_price.set')).toBe(true);
      expect(superAdminCan('pricing.fair_price.bulk_update')).toBe(true);

      // TOHFA_ADMIN explicitly may not, despite being operational head
      expect(tohfaAdminCan('pricing.fair_price.set')).toBe(false);
      expect(tohfaAdminCan('pricing.fair_price.bulk_update')).toBe(false);

      // Warehouse and Farmer admins may not set fair price ceilings
      expect(mainWhAdminCan('pricing.fair_price.set')).toBe(false);
      expect(subWhAdminCan('pricing.fair_price.set')).toBe(false);
      expect(farmerAdminCan('pricing.fair_price.set')).toBe(false);
    });

    it('BR-08: fair price viewing is readable across roles', () => {
      expect(superAdminCan('pricing.fair_price.view')).toBe(true);
      expect(tohfaAdminCan('pricing.fair_price.view')).toBe(true);
      expect(farmerAdminCan('pricing.fair_price.view')).toBe(true);
    });
  });

  describe('BR-26: Inter-warehouse transfers only by Main Warehouse Admin and Super Admin', () => {
    it('BR-26: transfer.inter_warehouse.initiate granted to SUPER_ADMIN and MAIN_WH_ADMIN only', () => {
      expect(superAdminCan('transfer.inter_warehouse.initiate')).toBe(true);
      expect(mainWhAdminCan('transfer.inter_warehouse.initiate')).toBe(true);

      expect(subWhAdminCan('transfer.inter_warehouse.initiate')).toBe(false);
      expect(tohfaAdminCan('transfer.inter_warehouse.initiate')).toBe(false);
      expect(farmerAdminCan('transfer.inter_warehouse.initiate')).toBe(false);
    });

    it('BR-26: transfer.high_value.approve is SUPER_ADMIN only', () => {
      expect(superAdminCan('transfer.high_value.approve')).toBe(true);
      expect(mainWhAdminCan('transfer.high_value.approve')).toBe(false);
      expect(subWhAdminCan('transfer.high_value.approve')).toBe(false);
      expect(tohfaAdminCan('transfer.high_value.approve')).toBe(false);
    });
  });

  describe('BR-28 & BR-28b: Admin creation is strictly hierarchical', () => {
    it('BR-28: SUPER_ADMIN can create any admin type', () => {
      expect(superAdminCan('admin.super_admin.create')).toBe(true);
      expect(superAdminCan('admin.tohfa_admin.create')).toBe(true);
      expect(superAdminCan('admin.farmer_admin.create')).toBe(true);
      expect(superAdminCan('admin.main_wh_admin.create')).toBe(true);
      expect(superAdminCan('admin.sub_wh_admin.create')).toBe(true);
      expect(superAdminCan('admin.account.disable')).toBe(true);
      expect(superAdminCan('role.permission.edit')).toBe(true);
    });

    it('BR-28b: TOHFA_ADMIN can only create FARMER_ADMIN and SUB_WH_ADMIN', () => {
      expect(tohfaAdminCan('admin.super_admin.create')).toBe(false);
      expect(tohfaAdminCan('admin.tohfa_admin.create')).toBe(false);
      expect(tohfaAdminCan('admin.main_wh_admin.create')).toBe(false);
      expect(tohfaAdminCan('role.permission.edit')).toBe(false);

      expect(tohfaAdminCan('admin.farmer_admin.create')).toBe(true);
      expect(tohfaAdminCan('admin.sub_wh_admin.create')).toBe(true);
    });

    it('BR-28: MAIN_WH_ADMIN can only create SUB_WH_ADMIN', () => {
      expect(mainWhAdminCan('admin.super_admin.create')).toBe(false);
      expect(mainWhAdminCan('admin.tohfa_admin.create')).toBe(false);
      expect(mainWhAdminCan('admin.main_wh_admin.create')).toBe(false);
      expect(mainWhAdminCan('admin.sub_wh_admin.create')).toBe(true);
    });
  });

  describe('BR-31 & BR-31b: Dual approval for payouts > Rs 10,000', () => {
    it('BR-31: payout.approve_above_10k is SUPER_ADMIN only', () => {
      expect(superAdminCan('payout.approve_above_10k')).toBe(true);
      expect(tohfaAdminCan('payout.approve_above_10k')).toBe(false);
      expect(mainWhAdminCan('payout.approve_above_10k')).toBe(false);
      expect(subWhAdminCan('payout.approve_above_10k')).toBe(false);
    });

    it('BR-31b: standard payouts up to Rs 10,000 can be initiated by TOHFA_ADMIN and SUPER_ADMIN', () => {
      expect(superAdminCan('payout.farmer.initiate')).toBe(true);
      expect(tohfaAdminCan('payout.farmer.initiate')).toBe(true);
    });
  });

  describe('BR-33: Aadhaar and mobile are locked fields', () => {
    it('BR-33: farmer.profile.edit_locked_field is granted to SUPER_ADMIN only', () => {
      expect(superAdminCan('farmer.profile.edit_locked_field')).toBe(true);
      expect(tohfaAdminCan('farmer.profile.edit_locked_field')).toBe(false);
      expect(farmerAdminCan('farmer.profile.edit_locked_field')).toBe(false);
      expect(mainWhAdminCan('farmer.profile.edit_locked_field')).toBe(false);
      expect(subWhAdminCan('farmer.profile.edit_locked_field')).toBe(false);
    });
  });

  describe('BR-34: Reactivating a disabled farmer is Super Admin only', () => {
    it('BR-34: both SUPER_ADMIN and TOHFA_ADMIN may disable a farmer account', () => {
      expect(superAdminCan('farmer.account.disable')).toBe(true);
      expect(tohfaAdminCan('farmer.account.disable')).toBe(true);
    });

    it('BR-34: only SUPER_ADMIN may reactivate a disabled farmer account', () => {
      expect(superAdminCan('farmer.account.reactivate')).toBe(true);
      expect(tohfaAdminCan('farmer.account.reactivate')).toBe(false);
      expect(farmerAdminCan('farmer.account.reactivate')).toBe(false);
    });
  });

  describe('BR-35: Audit log read and export authority', () => {
    it('BR-35: auditlog.export is SUPER_ADMIN only', () => {
      expect(superAdminCan('auditlog.export')).toBe(true);
      expect(tohfaAdminCan('auditlog.export')).toBe(false);
      expect(mainWhAdminCan('auditlog.export')).toBe(false);
      expect(subWhAdminCan('auditlog.export')).toBe(false);
    });

    it('BR-35: auditlog.view is readable by all administrative roles within scope', () => {
      expect(superAdminCan('auditlog.view')).toBe(true);
      expect(tohfaAdminCan('auditlog.view')).toBe(true);
      expect(mainWhAdminCan('auditlog.view')).toBe(true);
      expect(subWhAdminCan('auditlog.view')).toBe(true);
    });
  });

  describe('Spec Conflict: warehouse.capacity.set (Ch.6 precedence)', () => {
    it('warehouse.capacity.set: Chapter 6 wins over matrix, granting to SA, TA, and MAIN_WH_ADMIN', () => {
      // Requirements Chapter 6 grants to SA, TA, and MAIN_WH_ADMIN.
      // Matrix §7 had SA only. docs/rbac.json conflictPrecedence specifies Req Ch.6 wins.
      expect(superAdminCan('warehouse.capacity.set')).toBe(true);
      expect(tohfaAdminCan('warehouse.capacity.set')).toBe(true);
      expect(mainWhAdminCan('warehouse.capacity.set')).toBe(true);
      expect(subWhAdminCan('warehouse.capacity.set')).toBe(false);

      const conflict = rbac.conflicts.find((c) => c.topic.includes('capacity'));
      expect(conflict).toBeDefined();
      expect(conflict?.precedence).toBe('reqs Ch.6');
    });
  });

  describe('System configuration and channel allocations', () => {
    it('grants system config, integration key, and allocation percentage to SUPER_ADMIN only', () => {
      expect(superAdminCan('system.config.manage')).toBe(true);
      expect(tohfaAdminCan('system.config.manage')).toBe(false);

      expect(superAdminCan('system.integration_key.manage')).toBe(true);
      expect(tohfaAdminCan('system.integration_key.manage')).toBe(false);

      expect(superAdminCan('allocation.channel_percentage.set')).toBe(true);
      expect(tohfaAdminCan('allocation.channel_percentage.set')).toBe(false);

      expect(superAdminCan('audit.tier.configure_thresholds')).toBe(true);
      expect(tohfaAdminCan('audit.tier.configure_thresholds')).toBe(false);

      expect(superAdminCan('farmer.rating.configure_tiers')).toBe(true);
      expect(tohfaAdminCan('farmer.rating.configure_tiers')).toBe(false);
    });
  });

  describe('Farmer/Customer persona permissions are none for SUPER_ADMIN', () => {
    it('SUPER_ADMIN receives none of the *_own farmer or customer persona permissions', () => {
      expect(superAdminCan('farmer.profile.edit_own')).toBe(false);
      expect(superAdminCan('customer.order.create_own')).toBe(false);
      expect(superAdminCan('customer.cart.manage_own')).toBe(false);
    });
  });
});
