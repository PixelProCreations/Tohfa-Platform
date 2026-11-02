/**
 * BR-135: only a Farmer Admin may also be a farmer. SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN and
 * SUB_WH_ADMIN never also hold FARMER or CUSTOMER and never have a live `farmers` row.
 *
 * Pure rule tests (no database). The service guards that call this are tested in
 * admin-promotions.role-exclusivity.test.ts and farmer-applications.role-exclusivity.test.ts; the
 * database triggers of migration 0082 in roleExclusivity.db.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { AppError } from '../http/problem.js';
import { assertMayGrantRole, endUserRoleCodes, singleRoleAdminCodes } from './roleExclusivity.js';

const SINGLE_ROLE_ADMINS = [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.MAIN_WH_ADMIN, RoleCode.SUB_WH_ADMIN];
const END_USER_ROLES = [RoleCode.FARMER, RoleCode.CUSTOMER];

function refusal(fn: () => void): AppError {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error('expected a refusal, got none');
}

describe('BR-135: role exclusivity (single-role admins are never farmers or customers)', () => {
  it('BR-135: the single-role admin set is read from docs/rbac.json and is exactly the four staff admin roles', () => {
    expect([...singleRoleAdminCodes()].sort()).toEqual([...SINGLE_ROLE_ADMINS].sort());
    expect(singleRoleAdminCodes().has(RoleCode.FARMER_ADMIN)).toBe(false);
  });

  it('BR-135: the end-user roles are the farmer- and customer-scoped roles of docs/rbac.json', () => {
    expect([...endUserRoleCodes()].sort()).toEqual([...END_USER_ROLES].sort());
  });

  for (const admin of SINGLE_ROLE_ADMINS) {
    for (const endUser of END_USER_ROLES) {
      it(`BR-135: refuses granting ${endUser} to a ${admin}`, () => {
        const error = refusal(() => assertMayGrantRole({ roles: [admin], hasLiveFarmer: false }, endUser));
        expect(error.code).toBe('CONFLICT');
        expect(error.status).toBe(409);
        expect(error.meta).toMatchObject({ rule: 'BR-135' });
      });

      it(`BR-135: refuses granting ${admin} to a user holding ${endUser}`, () => {
        const error = refusal(() => assertMayGrantRole({ roles: [endUser], hasLiveFarmer: false }, admin));
        expect(error.code).toBe('CONFLICT');
      });
    }

    it(`BR-135: refuses granting ${admin} to a user with a live farmers row and no FARMER role`, () => {
      const error = refusal(() => assertMayGrantRole({ roles: [], hasLiveFarmer: true }, admin));
      expect(error.code).toBe('CONFLICT');
    });
  }

  it('BR-135: a Farmer Admin may also be a farmer (FARMER granted to a FARMER_ADMIN)', () => {
    expect(() =>
      assertMayGrantRole({ roles: [RoleCode.FARMER_ADMIN], hasLiveFarmer: false }, RoleCode.FARMER),
    ).not.toThrow();
  });

  it('BR-135: a farmer may become a Farmer Admin (FARMER_ADMIN granted to a farmer)', () => {
    expect(() =>
      assertMayGrantRole({ roles: [RoleCode.FARMER], hasLiveFarmer: true }, RoleCode.FARMER_ADMIN),
    ).not.toThrow();
  });

  it('BR-135: admin + admin combinations are not restricted by this rule (open question, contradiction 33)', () => {
    expect(() =>
      assertMayGrantRole({ roles: [RoleCode.FARMER_ADMIN], hasLiveFarmer: false }, RoleCode.TOHFA_ADMIN),
    ).not.toThrow();
    expect(() =>
      assertMayGrantRole({ roles: [RoleCode.TOHFA_ADMIN], hasLiveFarmer: false }, RoleCode.FARMER_ADMIN),
    ).not.toThrow();
    expect(() =>
      assertMayGrantRole({ roles: [RoleCode.SUB_WH_ADMIN], hasLiveFarmer: false }, RoleCode.MAIN_WH_ADMIN),
    ).not.toThrow();
  });

  it('BR-135: a user with no roles may be given any role', () => {
    for (const role of [...SINGLE_ROLE_ADMINS, ...END_USER_ROLES, RoleCode.FARMER_ADMIN]) {
      expect(() => assertMayGrantRole({ roles: [], hasLiveFarmer: false }, role)).not.toThrow();
    }
  });
});
