/**
 * Edit Farmer (Farmers Management, Phase 2C): the pure decisions behind the
 * single long form in screens/farmers/edit/. The PATCH body itself is built by
 * api/farmerMappers.ts buildFarmerPatch (tested in mappers_farmers.test.ts);
 * this covers what the screen adds on top: who may edit at all, the BR-33a
 * locked mobile, the +91 split of the E.164 mobile, the client-side checks and
 * the read-only rows for what the PATCH cannot change.
 */
import { describe, expect, it } from 'vitest';
import type { EditFarmerFormValues, FarmerDetailView } from '../api/farmerTypes';
import en from '../i18n/farmerDetail.en.json';
import {
  editFormErrors,
  editPatch,
  editReadOnlyRows,
  farmerEditAccess,
  farmerEditFetchId,
  joinMobile,
  savedFarmerRef,
  splitMobile,
} from '../screens/farmers/edit/model';

const DASH = en['farmerDetail.noValue'];
const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);
const VIEW = 'farmer.profile.view_all';
const EDIT = 'farmer.profile.edit';
const LOCKED = 'farmer.profile.edit_locked_field';

const initial: EditFarmerFormValues = {
  fullName: 'Lakshmi Devi',
  email: '',
  dob: '1980-04-12',
  gender: 'FEMALE',
  farmingExperienceYears: 12,
  addressLine1: '4 Tea Estate Road',
  addressLine2: '',
  village: 'Kil Kotagiri',
  taluk: '',
  district: 'Nilgiris',
  pincode: '643217',
  mobile: '+919000000042',
  aadhaarLast4: '4321',
};

describe('Edit Farmer access', () => {
  it('missing can denies (fail closed)', () => {
    expect(farmerEditAccess(undefined)).toEqual({ canEdit: false, canEditLockedFields: false });
  });

  it('needs farmer.profile.edit and farmer.profile.view_all (the form loads the profile)', () => {
    expect(farmerEditAccess(allow([VIEW])).canEdit).toBe(false);
    expect(farmerEditAccess(allow([EDIT])).canEdit).toBe(false);
    expect(farmerEditAccess(allow([VIEW, EDIT])).canEdit).toBe(true);
  });

  it('BR-33a: locked fields need farmer.profile.edit_locked_field on top of edit', () => {
    expect(farmerEditAccess(allow([VIEW, EDIT])).canEditLockedFields).toBe(false);
    expect(farmerEditAccess(allow([VIEW, EDIT, LOCKED])).canEditLockedFields).toBe(true);
    expect(farmerEditAccess(allow([VIEW, LOCKED])).canEditLockedFields).toBe(false);
  });

  it('no API call without edit access', () => {
    expect(farmerEditFetchId(farmerEditAccess(allow([VIEW])), 'f-1')).toBeUndefined();
    expect(farmerEditFetchId(farmerEditAccess(undefined), 'f-1')).toBeUndefined();
    expect(farmerEditFetchId(farmerEditAccess(allow([VIEW, EDIT])), 'f-1')).toBe('f-1');
  });
});

describe('Edit Farmer PATCH (BR-33a)', () => {
  it('BR-33a: a Tohfa Admin (no edit_locked_field) never sends the mobile, even if the field changed', () => {
    const edited = { ...initial, mobile: '+919999999999', fullName: 'Lakshmi D' };
    const patch = editPatch(initial, edited, farmerEditAccess(allow([VIEW, EDIT])));
    expect(patch).toEqual({ fullName: 'Lakshmi D' });
  });

  it('BR-33a: a holder of edit_locked_field sends the changed mobile', () => {
    const edited = { ...initial, mobile: '+919999999999' };
    expect(editPatch(initial, edited, farmerEditAccess(allow([VIEW, EDIT, LOCKED])))).toEqual({ mobile: '+919999999999' });
  });

  it('BR-33b: the Aadhaar is never sent by this form (it is read-only for everyone in the design)', () => {
    const edited = { ...initial, aadhaarLast4: '9999' };
    const patch = editPatch(initial, edited, farmerEditAccess(allow([VIEW, EDIT, LOCKED])));
    expect(patch).toBeNull();
  });

  it('nothing changed -> null (no request)', () => {
    expect(editPatch(initial, { ...initial }, farmerEditAccess(allow([VIEW, EDIT])))).toBeNull();
  });
});

describe('Edit Farmer form helpers', () => {
  it('splits and joins the E.164 mobile around the +91 prefix', () => {
    expect(splitMobile('+919000000042')).toEqual({ prefix: '+91', local: '9000000042' });
    expect(splitMobile('+447700900123')).toEqual({ prefix: '', local: '+447700900123' });
    expect(joinMobile({ prefix: '+91', local: ' 90000 00042 ' })).toBe('+919000000042');
    expect(joinMobile({ prefix: '', local: '+447700900123' })).toBe('+447700900123');
  });

  it('requires a 2-120 character name and a district (the API rules)', () => {
    expect(editFormErrors(initial)).toEqual([]);
    expect(editFormErrors({ ...initial, fullName: ' L ' })).toContain('farmerDetail.edit.error.name');
    expect(editFormErrors({ ...initial, district: '  ' })).toContain('farmerDetail.edit.error.district');
  });

  it("keeps App.tsx's onSave(updated, tab) shape: the caller's object with the saved name", () => {
    const ref = { id: 'f-1', name: 'Old', code: 'X' };
    expect(savedFarmerRef(ref, 'Lakshmi Devi')).toEqual({ id: 'f-1', name: 'Lakshmi Devi', code: 'X' });
  });

  it('fields the PATCH cannot change are read-only rows with API values or a dash, never fixture text', () => {
    const f = { zoneName: 'Kotagiri', landLocations: [] } as unknown as FarmerDetailView;
    const rows = Object.fromEntries(editReadOnlyRows(f).map((r) => [r.label, r.value]));
    expect(rows[en['farmerDetail.edit.zone']]).toBe('Kotagiri');
    expect(rows[en['farmerDetail.edit.warehouse']]).toBe(DASH);
    expect(rows[en['farmerDetail.edit.farmingType']]).toBe(DASH);
    expect(rows[en['farmerDetail.edit.farmName']]).toBe(DASH);
    expect(rows[en['farmerDetail.edit.totalArea']]).toBe(DASH);
    expect(JSON.stringify(rows)).not.toMatch(/Coonoor|Sub Warehouse|Organic|4\.25/);
  });
});
