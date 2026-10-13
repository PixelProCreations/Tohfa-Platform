import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ADMIN_PERMISSION_CODES, createAdminCan } from '../rbac/permissions';

interface RbacJson {
  permissions: { code: string; grants: Record<string, string> }[];
}

const rbac = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../../../../docs/rbac.json'), 'utf8'),
) as RbacJson;
const rbacCodes = new Set(rbac.permissions.map((p) => p.code));

describe('admin permission codes', () => {
  it('every code the admin app can gate on exists in docs/rbac.json (no invented codes)', () => {
    const missing = ADMIN_PERMISSION_CODES.filter((code) => !rbacCodes.has(code));
    expect(missing).toEqual([]);
  });

  it('has no duplicates', () => {
    expect(new Set(ADMIN_PERMISSION_CODES).size).toBe(ADMIN_PERMISSION_CODES.length);
  });

  it('BR-30: can() reflects the /auth/me permission list of a Sub Warehouse Admin', () => {
    // rbac.json grants SUB_WH_ADMIN rma.refund.bank_process = none, so the
    // server never lists it; the UI must hide the action, the server still refuses it.
    const subGrants = rbac.permissions
      .filter((p) => (p.grants.SUB_WH_ADMIN ?? 'none') !== 'none')
      .map((p) => p.code);
    const can = createAdminCan(subGrants);
    expect(can('wallet.cash_topup.process')).toBe(true);
    expect(can('rma.refund.bank_process')).toBe(false);
  });
});
