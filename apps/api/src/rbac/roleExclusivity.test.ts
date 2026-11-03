/**
 * BR-135: role exclusivity (owner rule 2026-11-03, final). A user holds exactly one role, except
 * that FARMER, FARMER_ADMIN and CUSTOMER form one group whose members may be held together in any
 * combination (`allowedRoleCombinations` in docs/rbac.json). SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN
 * and SUB_WH_ADMIN never share an account with any other role. A live `farmers` row counts as FARMER.
 *
 * Pure rule tests (no database). The service guards that call this are tested in
 * admin-promotions.role-exclusivity.test.ts and farmer-applications.role-exclusivity.test.ts; the
 * database triggers in roleExclusivity.db.test.ts.
 *
 * The 2026-11-02 version of this file asserted the looser rule (admin + admin unrestricted). Those
 * assertions were changed on 2026-11-03 because the owner changed the rule, not to go green.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { AppError } from '../http/problem.js';
import { allowedRoleCombinations, isAllowedRoleSet, loadRbac } from './loadRbac.js';
import { assertMayGrantRole, resultingRoleSet } from './roleExclusivity.js';

const SINGLE_ROLE_ADMINS = [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.MAIN_WH_ADMIN, RoleCode.SUB_WH_ADMIN];
const GROUP = [RoleCode.FARMER, RoleCode.FARMER_ADMIN, RoleCode.CUSTOMER];
const ALL_ROLES = [...SINGLE_ROLE_ADMINS, ...GROUP];

function refusal(fn: () => void): AppError {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error('expected a refusal, got none');
}

/** Every ordering of `codes`, so a combination is tried in every grant order. */
function permutations<T>(codes: readonly T[]): T[][] {
  if (codes.length <= 1) return [[...codes]];
  return codes.flatMap((code, i) => permutations([...codes.slice(0, i), ...codes.slice(i + 1)]).map((rest) => [code, ...rest]));
}

/** Grants `order` one by one to an account with no roles, checking each step. */
function grantInOrder(order: readonly string[]): void {
  const held: string[] = [];
  for (const code of order) {
    assertMayGrantRole({ roles: held, hasLiveFarmer: false }, code);
    held.push(code);
  }
}

describe('BR-135: allowedRoleCombinations in docs/rbac.json', () => {
  it('BR-135: declares exactly one group, FARMER + FARMER_ADMIN + CUSTOMER', () => {
    expect(allowedRoleCombinations().map((group) => [...group].sort())).toEqual([[...GROUP].sort()]);
  });

  it('BR-135: every role in a combination is a role of docs/rbac.json', () => {
    const codes = new Set<string>(loadRbac().document.roles.map((role) => role.code));
    for (const group of allowedRoleCombinations()) {
      for (const code of group) expect(codes.has(code)).toBe(true);
    }
  });

  it('BR-135: isAllowedRoleSet allows no role and every single role', () => {
    expect(isAllowedRoleSet([])).toBe(true);
    for (const role of ALL_ROLES) expect(isAllowedRoleSet([role])).toBe(true);
  });

  it('BR-135: isAllowedRoleSet allows every subset of the group, in any order', () => {
    for (const set of [
      [RoleCode.FARMER, RoleCode.FARMER_ADMIN],
      [RoleCode.FARMER, RoleCode.CUSTOMER],
      [RoleCode.FARMER_ADMIN, RoleCode.CUSTOMER],
      [RoleCode.FARMER, RoleCode.FARMER_ADMIN, RoleCode.CUSTOMER],
    ]) {
      for (const order of permutations(set)) expect(isAllowedRoleSet(order)).toBe(true);
    }
  });

  it('BR-135: isAllowedRoleSet refuses a single-role admin combined with any other role', () => {
    for (const admin of SINGLE_ROLE_ADMINS) {
      for (const other of ALL_ROLES.filter((code) => code !== admin)) {
        expect(isAllowedRoleSet([admin, other])).toBe(false);
        expect(isAllowedRoleSet([other, admin])).toBe(false);
      }
    }
    expect(isAllowedRoleSet([RoleCode.FARMER, RoleCode.FARMER_ADMIN, RoleCode.CUSTOMER, RoleCode.TOHFA_ADMIN])).toBe(false);
  });

  it('BR-135: a duplicated code is one role (FARMER twice is just FARMER)', () => {
    expect(isAllowedRoleSet([RoleCode.SUB_WH_ADMIN, RoleCode.SUB_WH_ADMIN])).toBe(true);
  });
});

describe('BR-135: assertMayGrantRole', () => {
  it('BR-135: refuses TOHFA_ADMIN + FARMER_ADMIN in both grant orders (409, meta.rule)', () => {
    for (const [held, granted] of [
      [RoleCode.TOHFA_ADMIN, RoleCode.FARMER_ADMIN],
      [RoleCode.FARMER_ADMIN, RoleCode.TOHFA_ADMIN],
    ] as const) {
      const error = refusal(() => assertMayGrantRole({ roles: [held], hasLiveFarmer: false }, granted));
      expect(error.code).toBe('CONFLICT');
      expect(error.status).toBe(409);
      expect(error.meta).toMatchObject({ rule: 'BR-135', role: granted });
    }
  });

  for (const admin of SINGLE_ROLE_ADMINS) {
    for (const other of ALL_ROLES.filter((code) => code !== admin)) {
      it(`BR-135: refuses granting ${other} to a ${admin}, and ${admin} to a holder of ${other}`, () => {
        expect(refusal(() => assertMayGrantRole({ roles: [admin], hasLiveFarmer: false }, other)).code).toBe('CONFLICT');
        expect(refusal(() => assertMayGrantRole({ roles: [other], hasLiveFarmer: false }, admin)).code).toBe('CONFLICT');
      });
    }

    it(`BR-135: refuses granting ${admin} to a user with a live farmers row and no role`, () => {
      expect(refusal(() => assertMayGrantRole({ roles: [], hasLiveFarmer: true }, admin)).code).toBe('CONFLICT');
    });

    it(`BR-135: a ${admin} alone is allowed, and re-granting a role already held is no change`, () => {
      expect(() => assertMayGrantRole({ roles: [], hasLiveFarmer: false }, admin)).not.toThrow();
      expect(() => assertMayGrantRole({ roles: [admin], hasLiveFarmer: false }, admin)).not.toThrow();
    });
  }

  it('BR-135: every subset of FARMER, FARMER_ADMIN, CUSTOMER can be built up in every grant order', () => {
    for (const set of [
      [RoleCode.FARMER, RoleCode.FARMER_ADMIN],
      [RoleCode.FARMER, RoleCode.CUSTOMER],
      [RoleCode.FARMER_ADMIN, RoleCode.CUSTOMER],
      [RoleCode.FARMER, RoleCode.FARMER_ADMIN, RoleCode.CUSTOMER],
    ]) {
      for (const order of permutations(set)) expect(() => grantInOrder(order)).not.toThrow();
    }
  });

  it('BR-135: CUSTOMER or FARMER_ADMIN may be granted to a user with a live farmers row', () => {
    expect(() => assertMayGrantRole({ roles: [], hasLiveFarmer: true }, RoleCode.CUSTOMER)).not.toThrow();
    expect(() => assertMayGrantRole({ roles: [RoleCode.FARMER], hasLiveFarmer: true }, RoleCode.FARMER_ADMIN)).not.toThrow();
  });

  it('BR-135: a role that ends in the same change does not count (ending)', () => {
    // FARMER_ADMIN -> TOHFA_ADMIN on an account holding only FARMER_ADMIN: allowed.
    expect(() =>
      assertMayGrantRole({ roles: [RoleCode.FARMER_ADMIN], hasLiveFarmer: false }, RoleCode.TOHFA_ADMIN, {
        ending: RoleCode.FARMER_ADMIN,
      }),
    ).not.toThrow();
    // ... but not while FARMER, CUSTOMER or a live farmers row remains.
    for (const holding of [
      { roles: [RoleCode.FARMER_ADMIN, RoleCode.FARMER], hasLiveFarmer: false },
      { roles: [RoleCode.FARMER_ADMIN, RoleCode.CUSTOMER], hasLiveFarmer: false },
      { roles: [RoleCode.FARMER_ADMIN], hasLiveFarmer: true },
    ]) {
      expect(refusal(() => assertMayGrantRole(holding, RoleCode.TOHFA_ADMIN, { ending: RoleCode.FARMER_ADMIN })).code).toBe(
        'CONFLICT',
      );
    }
  });

  it('BR-135: resultingRoleSet counts a live farmers row as FARMER and drops the ending role', () => {
    expect(resultingRoleSet({ roles: [RoleCode.FARMER_ADMIN], hasLiveFarmer: true }, RoleCode.TOHFA_ADMIN, RoleCode.FARMER_ADMIN).sort()).toEqual(
      [RoleCode.FARMER, RoleCode.TOHFA_ADMIN].sort(),
    );
    expect(resultingRoleSet({ roles: [RoleCode.FARMER], hasLiveFarmer: true }, RoleCode.FARMER)).toEqual([RoleCode.FARMER]);
  });
});
