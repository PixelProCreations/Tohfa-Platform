/**
 * Edit Farmer: the decisions behind the single long form, as pure functions
 * (../../../tests/farmerEdit_model.test.ts).
 *
 * Only fields PATCH /admin/farmers/{id} accepts are inputs. The PATCH body is
 * built by api/farmerMappers.ts buildFarmerPatch, which enforces BR-33a: the
 * mobile is sent only for a holder of `farmer.profile.edit_locked_field`
 * (SUPER_ADMIN). The Aadhaar is read-only for everyone in the design, so this
 * form never sends it. What the PATCH cannot change (zone, warehouse, farming
 * type, farm name, total area, plots, documents) is shown read-only with the
 * API value or the dash, with no fake picker.
 */
import { buildFarmerPatch } from '../../../api/farmerMappers';
import type { UpdateAdminFarmerBody } from '../../../api/farmers';
import { FARMER_GENDERS, FARMER_NAME_MAX, FARMER_NAME_MIN, type FarmerGender } from '../../../api/farmers';
import type { EditFarmerFormValues, FarmerDetailView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { FARMER_DETAIL_CODES, noValue, type DetailRow } from '../detail/model';

export interface FarmerEditAccess {
  canEdit: boolean;
  canEditLockedFields: boolean;
}

/** Fails closed. The form loads the profile, so it needs view_all as well as edit. */
export function farmerEditAccess(can: Can | undefined): FarmerEditAccess {
  const has = (code: string): boolean => can !== undefined && can(code) === true;
  const canEdit = has(FARMER_DETAIL_CODES.view) && has(FARMER_DETAIL_CODES.edit);
  return { canEdit, canEditLockedFields: canEdit && has(FARMER_DETAIL_CODES.editLockedField) };
}

/** The id the profile query gets: none without edit access, so nothing is fetched. */
export function farmerEditFetchId(access: FarmerEditAccess, farmerId: string | undefined): string | undefined {
  return access.canEdit ? farmerId : undefined;
}

/** BR-33a via buildFarmerPatch; the Aadhaar is pinned to its initial value so it is never sent. */
export function editPatch(
  initial: EditFarmerFormValues,
  edited: EditFarmerFormValues,
  access: FarmerEditAccess,
): UpdateAdminFarmerBody | null {
  return buildFarmerPatch(initial, { ...edited, aadhaarLast4: initial.aadhaarLast4 }, {
    canEditLockedFields: access.canEditLockedFields,
  });
}

export interface MobileParts {
  prefix: string;
  local: string;
}

const INDIA_PREFIX = '+91';

/** The design's "+91" box: split an E.164 Indian number; anything else stays whole. */
export function splitMobile(e164: string): MobileParts {
  return e164.startsWith(INDIA_PREFIX) ? { prefix: INDIA_PREFIX, local: e164.slice(INDIA_PREFIX.length) } : { prefix: '', local: e164 };
}

export function joinMobile(parts: MobileParts): string {
  const local = parts.local.replace(/\s+/g, '');
  return `${parts.prefix}${local}`;
}

/** The API's own limits (admin-farmers.schema.ts): a 2-120 character name and a district. */
export function editFormErrors(values: EditFarmerFormValues): TranslationKey[] {
  const errors: TranslationKey[] = [];
  const name = values.fullName.trim();
  if (name.length < FARMER_NAME_MIN || name.length > FARMER_NAME_MAX) errors.push('farmerDetail.edit.error.name');
  if (values.district.trim() === '') errors.push('farmerDetail.edit.error.district');
  return errors;
}

export const GENDER_OPTIONS: readonly FarmerGender[] = FARMER_GENDERS;

export function genderLabel(gender: FarmerGender): string {
  return t(`farmerDetail.edit.gender.${gender}`);
}

/** App.tsx's onSave(updated, tab) contract: the caller's own object, with the name the server stored. */
export function savedFarmerRef<T extends { name: string }>(farmer: T, savedName: string): T {
  return { ...farmer, name: savedName };
}

/** Fields the PATCH cannot change, read-only. Only the zone has an API source. */
export function editReadOnlyRows(f: Pick<FarmerDetailView, 'zoneName'>): DetailRow[] {
  const zone = f.zoneName === null || f.zoneName.trim() === '' ? noValue() : f.zoneName;
  return [
    { label: t('farmerDetail.edit.zone'), value: zone },
    { label: t('farmerDetail.edit.warehouse'), value: noValue() },
    { label: t('farmerDetail.edit.farmingType'), value: noValue() },
    { label: t('farmerDetail.edit.farmName'), value: noValue() },
    { label: t('farmerDetail.edit.totalArea'), value: noValue() },
  ];
}
