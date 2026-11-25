/**
 * BR-135: an account may hold FARMER and CUSTOMER together. Which of them a
 * sign-in opens is the entry the person chose in the app (farmer/staff Login,
 * or the customer OTP sign-in), never whichever role the server listed first.
 * These pin the pure role selection and the remembered entry used by the
 * Splash / Create Password re-routes.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetEntryRoleForTests,
  forgetEntryRole,
  readEntryRole,
  rememberEntryRole,
  rolesForEntry,
  rolesForSession,
} from './entryRole';

const FARMER = { code: 'FARMER' };
const CUSTOMER = { code: 'CUSTOMER' };
const FARMER_ADMIN = { code: 'FARMER_ADMIN' };
const SUB_WH_ADMIN = { code: 'SUB_WH_ADMIN' };

describe('rolesForEntry', () => {
  it('BR-135: the farmer entry of a FARMER + CUSTOMER account keeps FARMER, whatever order the server listed', () => {
    expect(rolesForEntry('FARMER', [CUSTOMER, FARMER])).toEqual({ ok: true, roles: [FARMER] });
    expect(rolesForEntry('FARMER', [FARMER, CUSTOMER])).toEqual({ ok: true, roles: [FARMER] });
  });

  it('BR-135: the customer entry of a FARMER + CUSTOMER account keeps CUSTOMER, whatever order the server listed', () => {
    expect(rolesForEntry('CUSTOMER', [FARMER, CUSTOMER])).toEqual({ ok: true, roles: [CUSTOMER] });
    expect(rolesForEntry('CUSTOMER', [CUSTOMER, FARMER])).toEqual({ ok: true, roles: [CUSTOMER] });
  });

  it('BR-135: the farmer entry is also the staff sign-in, so admin roles pass through it', () => {
    expect(rolesForEntry('FARMER', [FARMER_ADMIN, CUSTOMER])).toEqual({ ok: true, roles: [FARMER_ADMIN] });
    expect(rolesForEntry('FARMER', [SUB_WH_ADMIN])).toEqual({ ok: true, roles: [SUB_WH_ADMIN] });
  });

  it('BR-135: an entry whose role the account does not hold is refused, never switched to the other role', () => {
    expect(rolesForEntry('FARMER', [CUSTOMER])).toEqual({ ok: false });
    expect(rolesForEntry('CUSTOMER', [FARMER])).toEqual({ ok: false });
    expect(rolesForEntry('CUSTOMER', [SUB_WH_ADMIN])).toEqual({ ok: false });
  });

  it('BR-135: an account with no role rows is passed through unchanged (the server decides, as before)', () => {
    expect(rolesForEntry('FARMER', [])).toEqual({ ok: true, roles: [] });
    expect(rolesForEntry('CUSTOMER', undefined)).toEqual({ ok: true, roles: [] });
  });
});

describe('rolesForSession', () => {
  it('BR-135: with no remembered entry (a session from before this change) the roles are unchanged', () => {
    expect(rolesForSession(null, [CUSTOMER, FARMER])).toEqual([CUSTOMER, FARMER]);
  });

  it('BR-135: a remembered entry narrows the restored session to that entry', () => {
    expect(rolesForSession('FARMER', [CUSTOMER, FARMER])).toEqual([FARMER]);
    expect(rolesForSession('CUSTOMER', [FARMER, CUSTOMER])).toEqual([CUSTOMER]);
  });

  it('BR-135: a remembered entry the account no longer matches leaves the roles to the normal routing', () => {
    expect(rolesForSession('FARMER', [CUSTOMER])).toEqual([CUSTOMER]);
  });
});

describe('remembered entry', () => {
  beforeEach(async () => {
    __resetEntryRoleForTests();
    await forgetEntryRole();
  });

  it('BR-135: remembers the entry across a cold start and forgets it on sign-out', async () => {
    expect(await readEntryRole()).toBeNull();
    await rememberEntryRole('CUSTOMER');
    __resetEntryRoleForTests(); // a cold start: the in-memory copy is gone, storage is not
    expect(await readEntryRole()).toBe('CUSTOMER');
    await forgetEntryRole();
    __resetEntryRoleForTests();
    expect(await readEntryRole()).toBeNull();
  });
});
