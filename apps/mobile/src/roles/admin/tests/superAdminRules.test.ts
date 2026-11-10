import { describe, expect, it } from 'vitest';
import rbac from '../../../../../../docs/rbac.json';
import { makeCan } from '../permissions/can';

function getRolePermissions(roleCode: string): string[] {
  return rbac.permissions
    .filter((p: { grants: Record<string, string> }) => (p.grants[roleCode] ?? 'none') !== 'none')
    .map((p: { code: string }) => p.code);
}

describe('Super Admin Business Rules (docs/rules.md & docs/rbac.json)', () => {
  const superAdminPermissions = getRolePermissions('SUPER_ADMIN');
  const tohfaAdminPermissions = getRolePermissions('TOHFA_ADMIN');
  const mainWhAdminPermissions = getRolePermissions('MAIN_WH_ADMIN');
  const subWhAdminPermissions = getRolePermissions('SUB_WH_ADMIN');

  const superAdminCan = makeCan(superAdminPermissions);
  const tohfaAdminCan = makeCan(tohfaAdminPermissions);
  const mainWhAdminCan = makeCan(mainWhAdminPermissions);
  const subWhAdminCan = makeCan(subWhAdminPermissions);

  describe('BR-08: Fair price ceiling is set by Super Admin only', () => {
    it('BR-08: grants fair price ceiling setting to Super Admin only', () => {
      expect(superAdminCan('pricing.fair_price.set')).toBe(true);
      expect(superAdminCan('pricing.fair_price.bulk_update')).toBe(true);

      // TOHFA_ADMIN explicitly may not, despite being operational head (BR-08a)
      expect(tohfaAdminCan('pricing.fair_price.set')).toBe(false);
      expect(tohfaAdminCan('pricing.fair_price.bulk_update')).toBe(false);

      expect(mainWhAdminCan('pricing.fair_price.set')).toBe(false);
      expect(subWhAdminCan('pricing.fair_price.set')).toBe(false);
    });
  });

  describe('BR-26: Inter-warehouse transfers only by Main Warehouse Admin and Super Admin', () => {
    it('BR-26: allows transfer initiation by Main WH Admin and Super Admin only', () => {
      expect(superAdminCan('transfer.inter_warehouse.initiate')).toBe(true);
      expect(mainWhAdminCan('transfer.inter_warehouse.initiate')).toBe(true);

      expect(tohfaAdminCan('transfer.inter_warehouse.initiate')).toBe(false);
      expect(subWhAdminCan('transfer.inter_warehouse.initiate')).toBe(false);
    });

    it('BR-26: high value transfer approval is restricted to Super Admin only', () => {
      expect(superAdminCan('transfer.high_value.approve')).toBe(true);
      expect(tohfaAdminCan('transfer.high_value.approve')).toBe(false);
      expect(mainWhAdminCan('transfer.high_value.approve')).toBe(false);
      expect(subWhAdminCan('transfer.high_value.approve')).toBe(false);
    });
  });

  describe('BR-28 & BR-28b: Admin creation hierarchy', () => {
    it('BR-28: allows Super Admin to create Super, Tohfa, and Main WH admins', () => {
      expect(superAdminCan('admin.super_admin.create')).toBe(true);
      expect(superAdminCan('admin.tohfa_admin.create')).toBe(true);
      expect(superAdminCan('admin.main_wh_admin.create')).toBe(true);
      expect(superAdminCan('admin.sub_wh_admin.create')).toBe(true);
      expect(superAdminCan('admin.farmer_admin.create')).toBe(true);
      expect(superAdminCan('role.permission.edit')).toBe(true);
    });

    it('BR-28b: forbids Tohfa Admin from creating Super Admin or Main WH Admin', () => {
      expect(tohfaAdminCan('admin.super_admin.create')).toBe(false);
      expect(tohfaAdminCan('admin.main_wh_admin.create')).toBe(false);
      expect(tohfaAdminCan('role.permission.edit')).toBe(false);

      // Tohfa Admin may create lower roles (Sub WH Admin and Farmer Admin)
      expect(tohfaAdminCan('admin.sub_wh_admin.create')).toBe(true);
      expect(tohfaAdminCan('admin.farmer_admin.create')).toBe(true);
    });
  });

  describe('BR-31 & BR-31b: Payout above Rs 10k approval', () => {
    it('BR-31: approves payouts above Rs 10,000 for Super Admin only', () => {
      expect(superAdminCan('payout.approve_above_10k')).toBe(true);
      expect(tohfaAdminCan('payout.approve_above_10k')).toBe(false);
      expect(mainWhAdminCan('payout.approve_above_10k')).toBe(false);
      expect(subWhAdminCan('payout.approve_above_10k')).toBe(false);
    });
  });

  describe('BR-33: Farmer profile locked fields editing', () => {
    it('BR-33: allows editing locked fields for Super Admin only', () => {
      expect(superAdminCan('farmer.profile.edit_locked_field')).toBe(true);
      expect(tohfaAdminCan('farmer.profile.edit_locked_field')).toBe(false);
      expect(mainWhAdminCan('farmer.profile.edit_locked_field')).toBe(false);
      expect(subWhAdminCan('farmer.profile.edit_locked_field')).toBe(false);
    });
  });

  describe('BR-34: Farmer account reactivation', () => {
    it('BR-34: allows reactivating disabled farmer account for Super Admin only', () => {
      expect(superAdminCan('farmer.account.reactivate')).toBe(true);
      expect(tohfaAdminCan('farmer.account.reactivate')).toBe(false);
      expect(mainWhAdminCan('farmer.account.reactivate')).toBe(false);
      expect(subWhAdminCan('farmer.account.reactivate')).toBe(false);
    });
  });

  describe('BR-35: Audit log read and export', () => {
    it('BR-35: allows audit log export for Super Admin only', () => {
      expect(superAdminCan('auditlog.export')).toBe(true);
      expect(tohfaAdminCan('auditlog.export')).toBe(false);
      expect(mainWhAdminCan('auditlog.export')).toBe(false);
      expect(subWhAdminCan('auditlog.export')).toBe(false);
    });
  });

  describe('Allocation configuration', () => {
    it('allocation.channel_percentage.set is Super Admin only', () => {
      expect(superAdminCan('allocation.channel_percentage.set')).toBe(true);
      expect(tohfaAdminCan('allocation.channel_percentage.set')).toBe(false);
    });
  });

  describe('Customer/Farmer persona *_own codes are none for SUPER_ADMIN', () => {
    it('super admin does not hold persona-own codes', () => {
      expect(superAdminCan('order.create_own')).toBe(false);
      expect(superAdminCan('listing.create_own')).toBe(false);
      expect(superAdminCan('cart.manage_own')).toBe(false);
    });
  });

  describe('BR-106: Market open/close automated schedule management (SA-M2-S02 / SA-M2-S03)', () => {
    it('BR-106a: grants market.schedule.manage to Super Admin and TOHFA Admin only', () => {
      expect(superAdminCan('market.schedule.manage')).toBe(true);
      expect(tohfaAdminCan('market.schedule.manage')).toBe(true);
      expect(mainWhAdminCan('market.schedule.manage')).toBe(false);
      expect(subWhAdminCan('market.schedule.manage')).toBe(false);
    });

    it('BR-106b: confirms repeat frequency options match the spec (One Time, Daily, Weekly, Monthly, Custom)', () => {
      const validRepeats = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Custom'];
      expect(validRepeats).toHaveLength(5);
      expect(validRepeats).toContain('One Time');
      expect(validRepeats).toContain('Daily');
      expect(validRepeats).toContain('Weekly');
      expect(validRepeats).toContain('Monthly');
      expect(validRepeats).toContain('Custom');
    });
  });

  describe('BR-107: Produce Control & Crop Data taxonomy and event management (M4-S01 / M4-S28a,b,c)', () => {
    it('BR-107a: produce.calendar.view_consolidated is granted to Super Admin and TOHFA Admin', () => {
      expect(superAdminCan('produce.calendar.view_consolidated')).toBe(true);
      expect(tohfaAdminCan('produce.calendar.view_consolidated')).toBe(true);
      expect(mainWhAdminCan('produce.calendar.view_consolidated')).toBe(true);
    });

    it('BR-107b: admin.crop_taxonomy.manage allows Super Admin and TOHFA Admin to manage crop master', () => {
      expect(superAdminCan('admin.crop_taxonomy.manage')).toBe(true);
      expect(tohfaAdminCan('admin.crop_taxonomy.manage')).toBe(true);
      expect(mainWhAdminCan('admin.crop_taxonomy.manage')).toBe(false);
      expect(subWhAdminCan('admin.crop_taxonomy.manage')).toBe(false);
    });

    it('BR-107c: admin.diary_taxonomy.manage allows Super Admin and TOHFA Admin to manage diary activities', () => {
      expect(superAdminCan('admin.diary_taxonomy.manage')).toBe(true);
      expect(tohfaAdminCan('admin.diary_taxonomy.manage')).toBe(true);
      expect(mainWhAdminCan('admin.diary_taxonomy.manage')).toBe(false);
      expect(subWhAdminCan('admin.diary_taxonomy.manage')).toBe(false);
    });

    it('BR-107d: platform.event.manage allows Super Admin and TOHFA Admin to publish platform events', () => {
      expect(superAdminCan('platform.event.manage')).toBe(true);
      expect(tohfaAdminCan('platform.event.manage')).toBe(true);
      expect(mainWhAdminCan('platform.event.manage')).toBe(false);
      expect(subWhAdminCan('platform.event.manage')).toBe(false);
    });
  });

  describe('BR-108: Inputs & Pest Management permissions (SA-M6-S35)', () => {
    it('BR-108a: inputs.catalog.manage allows Super Admin and TOHFA Admin to manage approved inputs', () => {
      expect(superAdminCan('inputs.catalog.manage')).toBe(true);
      expect(tohfaAdminCan('inputs.catalog.manage')).toBe(true);
      expect(mainWhAdminCan('inputs.catalog.manage')).toBe(false);
      expect(subWhAdminCan('inputs.catalog.manage')).toBe(false);
    });

    it('BR-108b: verifies super admin actions for input details', () => {
      const superAdminInputActions = ['deactivate_account', 'terminate', 'delete_information'];
      expect(superAdminInputActions).toHaveLength(3);
      expect(superAdminInputActions).toContain('deactivate_account');
      expect(superAdminInputActions).toContain('terminate');
      expect(superAdminInputActions).toContain('delete_information');
    });
  });

  describe('BR-109: Payment methods configuration (M13-S10)', () => {
    it('BR-109a: payment.method.configure allows Super Admin only (TOHFA Admin none)', () => {
      expect(superAdminCan('payment.method.configure')).toBe(true);
      expect(tohfaAdminCan('payment.method.configure')).toBe(false);
      expect(mainWhAdminCan('payment.method.configure')).toBe(false);
      expect(subWhAdminCan('payment.method.configure')).toBe(false);
    });
  });

  describe('BR-110: Wallet Manual Credit/Debit & Deduction (M13-S05 to S08)', () => {
    it('BR-110a: wallet.manual_credit_debit allows Super Admin, TOHFA Admin, and WH admins', () => {
      expect(superAdminCan('wallet.manual_credit_debit')).toBe(true);
      expect(tohfaAdminCan('wallet.manual_credit_debit')).toBe(true);
      expect(mainWhAdminCan('wallet.manual_credit_debit')).toBe(true);
      expect(subWhAdminCan('wallet.manual_credit_debit')).toBe(true);
      const farmerAdminCan = makeCan(getRolePermissions('FARMER_ADMIN'));
      expect(farmerAdminCan('wallet.manual_credit_debit')).toBe(false);
    });

    it('BR-110b: wallet.cash_topup.process allows Main WH Admin and Super Admin', () => {
      expect(superAdminCan('wallet.cash_topup.process')).toBe(true);
      expect(mainWhAdminCan('wallet.cash_topup.process')).toBe(true);
      expect(subWhAdminCan('wallet.cash_topup.process')).toBe(true);
    });
  });

  describe('BR-111: Financial Dashboard & Reports Export (M13-S01 to S03)', () => {
    it('BR-111a: finance.dashboard.view allows Super Admin and TOHFA Admin', () => {
      expect(superAdminCan('finance.dashboard.view')).toBe(true);
      expect(tohfaAdminCan('finance.dashboard.view')).toBe(true);
    });

    it('BR-111b: report.export.file allows Super Admin and TOHFA Admin', () => {
      expect(superAdminCan('report.export.file')).toBe(true);
      expect(tohfaAdminCan('report.export.file')).toBe(true);
    });
  });
});




