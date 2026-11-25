/**
 * Pure logic for the access screens of the staff module (Roles, Assign
 * Access, Create Staff Account, Attendance Correction). Kept out of the
 * screens so it can be tested in plain Node, as ./mappers.ts is.
 *
 * Codes (docs/rbac.json):
 *   role.definition.view       Roles and Assign Access read GET /roles
 *   admin.<role>.create       one per admin role; POST /admin/accounts (four roles)
 *                              and POST /admin/sub-warehouse-admins (SUB_WH_ADMIN)
 *   admin.staff.manage         a staff record without a login (POST /admin/warehouse-staff)
 *   admin.staff.attendance.mark  the correction write (PUT .../staff/{id}/{date})
 *
 * Role codes below are API request values and display lookups for role
 * definitions returned by the server; they never decide what the viewer may do.
 */
import type { AdminAccountRole, CreateAdminAccountBody } from '../../../api/adminAccounts';
import { ADMIN_MOBILE_PATTERN, ADMIN_NAME_MAX } from '../../../api/adminAccounts';
import type { AttendanceStatusCode, MarkAttendanceBody } from '../../../api/attendance';
import type { RoleDefinitionDto, RolePermissionGrantDto } from '../../../api/roles';
import type { CreateSubAdminBody } from '../../../api/subAdmins';
import type { CreateStaffBody, StaffStatus } from '../../../api/staff';
import type { TranslationKey } from '../../../i18n';
import { ACCOUNT_CREATE_CODES, buildCreateStaffBody, STAFF_CODES, type FormResult, type StaffForm } from './mappers';
import type { PermissionCheck } from './types';

/** Every role a login can be created for (keys of ACCOUNT_CREATE_CODES). */
export type LoginRole = AdminAccountRole | 'SUB_WH_ADMIN';

export const LOGIN_ROLES: readonly LoginRole[] = ['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN'];

/** The "Application Role" options of the design, in its order. */
export type ApplicationRole = LoginRole | 'WAREHOUSE_STAFF' | 'DRIVER';
export const APPLICATION_ROLES: readonly ApplicationRole[] = [...LOGIN_ROLES, 'WAREHOUSE_STAFF', 'DRIVER'];

export type AccountAccess = 'login' | 'no_login';

export const APPLICATION_ROLE_LABEL: Readonly<Record<ApplicationRole, TranslationKey>> = {
  SUPER_ADMIN: 'staffAccess.role.SUPER_ADMIN',
  TOHFA_ADMIN: 'staffAccess.role.TOHFA_ADMIN',
  FARMER_ADMIN: 'staffAccess.role.FARMER_ADMIN',
  MAIN_WH_ADMIN: 'staffAccess.role.MAIN_WH_ADMIN',
  SUB_WH_ADMIN: 'staffAccess.role.SUB_WH_ADMIN',
  WAREHOUSE_STAFF: 'staffAccess.role.WAREHOUSE_STAFF',
  DRIVER: 'staffAccess.role.DRIVER',
};

export function canViewRoles(can: PermissionCheck): boolean {
  return can(STAFF_CODES.roleView);
}

/** Roles the viewer may create a login for (the server checks again, BR-28). */
export function creatableLoginRoles(can: PermissionCheck): LoginRole[] {
  return LOGIN_ROLES.filter((role) => can(ACCOUNT_CREATE_CODES[role]));
}

/**
 * True when the viewer may create a login through POST /admin/accounts (any
 * of its four roles). That is what the full "Create account" form adds over
 * the plain Add Staff form, so the Add Staff action opens it only then.
 */
export function canCreateAdminLogin(can: PermissionCheck): boolean {
  return creatableLoginRoles(can).some((role) => role !== 'SUB_WH_ADMIN');
}

/**
 * Whether an Application Role option can be chosen with the picked access.
 * A login needs its create code; a record without a login needs
 * admin.staff.manage. DRIVER never: the staff record has no type.
 */
export function applicationRoleSelectable(role: ApplicationRole, access: AccountAccess, can: PermissionCheck): boolean {
  if (role === 'DRIVER') return false;
  if (role === 'WAREHOUSE_STAFF') return access === 'no_login' && can(STAFF_CODES.manage);
  return access === 'login' && can(ACCOUNT_CREATE_CODES[role]);
}

// ─── Create account form ─────────────────────────────────────────────────────

export interface AccountForm {
  firstName: string;
  middleName: string;
  lastName: string;
  /** Digits as typed; a 10-digit number gets the India prefix. */
  mobile: string;
  designation: string;
  /** YYYY-MM-DD. */
  joinedOn: string;
  status: StaffStatus;
  access: AccountAccess;
  role: ApplicationRole | null;
}

export function emptyAccountForm(today: string): AccountForm {
  return {
    firstName: '',
    middleName: '',
    lastName: '',
    mobile: '',
    designation: '',
    joinedOn: today,
    status: 'ACTIVE',
    access: 'login',
    role: null,
  };
}

export function fullNameOf(form: Pick<AccountForm, 'firstName' | 'middleName' | 'lastName'>): string {
  return [form.firstName, form.middleName, form.lastName]
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join(' ');
}

/** The design's field helper: "10-digit Indian mobile number". */
const INDIA_PREFIX = '+91';
const TEN_DIGITS = /^[0-9]{10}$/;

/** E.164 for the login endpoints, or null when it cannot be one. */
export function toE164(mobile: string): string | null {
  const compact = mobile.replace(/[\s-]/g, '');
  const candidate = TEN_DIGITS.test(compact) ? `${INDIA_PREFIX}${compact}` : compact;
  return ADMIN_MOBILE_PATTERN.test(candidate) ? candidate : null;
}

export type AccountRequest =
  | { kind: 'admin'; body: CreateAdminAccountBody }
  | { kind: 'subAdmin'; body: CreateSubAdminBody }
  | { kind: 'staff'; body: CreateStaffBody };

/**
 * The request the form sends. A login goes to POST /admin/accounts, or to
 * POST /admin/sub-warehouse-admins for a Sub Warehouse Admin (which needs a
 * warehouse). A record without a login goes to POST /admin/warehouse-staff
 * through the same body builder as the Add Staff form. FARMER_ADMIN needs a
 * zone the app cannot list yet (no zone list endpoint), so it is refused here
 * rather than sent to a certain 422.
 */
export function buildAccountRequest(form: AccountForm, warehouseId: string | undefined): FormResult<AccountRequest> {
  if (form.firstName.trim() === '') return { ok: false, errorKey: 'staffAccess.create.error.firstName' };
  if (form.lastName.trim() === '') return { ok: false, errorKey: 'staffAccess.create.error.lastName' };
  const fullName = fullNameOf(form);
  if (fullName.length > ADMIN_NAME_MAX) return { ok: false, errorKey: 'staff.form.error.name' };
  if (form.role === null) return { ok: false, errorKey: 'staffAccess.create.error.role' };

  if (form.access === 'no_login') {
    if (form.role !== 'WAREHOUSE_STAFF') return { ok: false, errorKey: 'staffAccess.create.error.role' };
    const staffForm: StaffForm = {
      fullName,
      designation: form.designation,
      phone: form.mobile.replace(/[\s-]/g, ''),
      joinedOn: form.joinedOn,
      status: form.status,
    };
    const result = buildCreateStaffBody(staffForm, warehouseId);
    return result.ok ? { ok: true, body: { kind: 'staff', body: result.body } } : result;
  }

  if (form.role === 'WAREHOUSE_STAFF' || form.role === 'DRIVER') return { ok: false, errorKey: 'staffAccess.create.error.role' };
  const mobile = toE164(form.mobile);
  if (mobile === null) return { ok: false, errorKey: 'staffAccess.create.error.mobile' };
  if (form.role === 'FARMER_ADMIN') return { ok: false, errorKey: 'staffAccess.create.error.zone' };
  if (form.role === 'SUB_WH_ADMIN') {
    if (warehouseId === undefined) return { ok: false, errorKey: 'staff.form.error.warehouse' };
    return { ok: true, body: { kind: 'subAdmin', body: { fullName, mobile, warehouseId } } };
  }
  return { ok: true, body: { kind: 'admin', body: { role: form.role, fullName, mobile } } };
}

// ─── Roles and module permissions ────────────────────────────────────────────

export type RoleIconKind = 'crown' | 'bank' | 'shield' | 'mainWarehouse' | 'subWarehouse' | 'farmer' | 'customer' | 'generic';

const ROLE_ICON: Readonly<Record<string, RoleIconKind>> = {
  SUPER_ADMIN: 'crown',
  TOHFA_ADMIN: 'bank',
  FARMER_ADMIN: 'shield',
  MAIN_WH_ADMIN: 'mainWarehouse',
  SUB_WH_ADMIN: 'subWarehouse',
  FARMER: 'farmer',
  CUSTOMER: 'customer',
};

/** Which design icon a role definition from the server gets (unknown codes get a plain one). */
export function roleIconKind(code: string): RoleIconKind {
  return ROLE_ICON[code] ?? 'generic';
}

/** Search over name and summary, as the design's search bar. */
export function filterRoles(roles: readonly RoleDefinitionDto[], query: string): RoleDefinitionDto[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...roles];
  return roles.filter((r) => r.name.toLowerCase().includes(q) || (r.summary ?? '').toLowerCase().includes(q));
}

export interface ModuleRow {
  /** 1-based, the table's # column. */
  index: number;
  module: string;
  grants: RolePermissionGrantDto[];
}

/**
 * The Assign Access table: one row per module any role is granted something
 * in (first-seen order over the role list), each with the selected role's
 * grants in it. A module the role holds nothing in has no grants (access off).
 */
export function accessModuleRows(roles: readonly RoleDefinitionDto[], roleCode: string | undefined): ModuleRow[] {
  const selected = roles.find((r) => r.code === roleCode);
  const byModule = new Map<string, RolePermissionGrantDto[]>();
  for (const role of roles) {
    for (const grant of role.permissions) {
      if (!byModule.has(grant.module)) byModule.set(grant.module, []);
    }
  }
  for (const grant of selected?.permissions ?? []) byModule.get(grant.module)?.push(grant);
  return [...byModule.entries()].map(([module, grants], i) => ({ index: i + 1, module, grants }));
}

export type ModuleIconKind =
  | 'grid'
  | 'users'
  | 'produce'
  | 'audit'
  | 'leaf'
  | 'rupee'
  | 'cart'
  | 'sales'
  | 'warehouse'
  | 'finance'
  | 'bell'
  | 'idCard'
  | 'gear'
  | 'generic';

const MODULE_ICON: Readonly<Record<string, ModuleIconKind>> = {
  'Farmers Management': 'users',
  'Produce Control': 'produce',
  'Audit Management': 'audit',
  'Inputs & Pest Management': 'leaf',
  'Pest Management': 'leaf',
  'Market & Pricing': 'rupee',
  'Purchase Management': 'cart',
  'Sales Management': 'sales',
  'Customers Management': 'users',
  'Inventory & Warehouse': 'warehouse',
  'Reserve & Allocation': 'warehouse',
  'Accounts & Finance': 'finance',
  'Notifications & Reports': 'bell',
  'Workforce & Staff': 'idCard',
  'Settings & Profile': 'gear',
  'Authentication & Onboarding': 'grid',
};

export function moduleIconKind(module: string): ModuleIconKind {
  return MODULE_ICON[module] ?? 'generic';
}

// ─── Attendance correction ───────────────────────────────────────────────────

const HH_MM = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
/** Asia/Kolkata, the zone attendance dates are kept in (see ./mappers.ts). */
const IST_OFFSET = '+05:30';
/** API validation limit of `note` (StaffAttendanceMark), not a business threshold. */
export const CORRECTION_NOTE_MAX = 500;

/** An "HH:MM" on an IST calendar date as an ISO instant, or null. */
export function istTimeToIso(date: string, hhmm: string): string | null {
  const match = HH_MM.exec(hhmm.trim());
  if (match === null) return null;
  const ms = Date.parse(`${date}T${match[1]}:${match[2]}:00${IST_OFFSET}`);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

export interface CorrectionForm {
  status: AttendanceStatusCode | null;
  /** "HH:MM", '' = none. Only on a PRESENT day. */
  checkIn: string;
  checkOut: string;
  remarks: string;
}

/**
 * The PUT body of a correction. Remarks are required by the design and are
 * the record's `note`; times are sent only for PRESENT, a check-out needs a
 * check-in and cannot precede it (the server enforces the same).
 */
export function buildCorrectionBody(date: string, form: CorrectionForm): FormResult<MarkAttendanceBody> {
  if (form.status === null) return { ok: false, errorKey: 'staffAccess.correction.error.status' };
  const note = form.remarks.trim();
  if (note === '' || note.length > CORRECTION_NOTE_MAX) return { ok: false, errorKey: 'staffAccess.correction.error.remarks' };
  if (form.status !== 'PRESENT') return { ok: true, body: { status: form.status, note } };
  const inText = form.checkIn.trim();
  const outText = form.checkOut.trim();
  const checkIn = inText === '' ? null : istTimeToIso(date, inText);
  const checkOut = outText === '' ? null : istTimeToIso(date, outText);
  if ((inText !== '' && checkIn === null) || (outText !== '' && checkOut === null)) {
    return { ok: false, errorKey: 'staffAccess.correction.error.time' };
  }
  if (checkOut !== null && (checkIn === null || Date.parse(checkOut) < Date.parse(checkIn))) {
    return { ok: false, errorKey: 'staffAccess.correction.error.checkOut' };
  }
  return {
    ok: true,
    body: { status: 'PRESENT', note, ...(checkIn === null ? {} : { checkIn }), ...(checkOut === null ? {} : { checkOut }) },
  };
}

/** "HH:MM" (IST) of an ISO instant, for prefilling a correction. */
export function isoToIstHhMm(iso: string | null): string {
  if (iso === null) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  const ist = new Date(ms + (5 * 60 + 30) * 60 * 1000);
  return `${String(ist.getUTCHours()).padStart(2, '0')}:${String(ist.getUTCMinutes()).padStart(2, '0')}`;
}
