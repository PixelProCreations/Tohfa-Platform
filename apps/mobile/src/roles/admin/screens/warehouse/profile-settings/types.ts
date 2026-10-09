/**
 * Shared types for the warehouse account screens (design module M16, part A):
 * the Settings hub, the admin's own profile, notification preferences,
 * security, session & security, help & support and about. Part B adds the
 * warehouse-facing profile screens (M15: warehouse profile, storage,
 * operating, contact, documents, warehouse settings) at the end of the file.
 *
 * These lived in roles/subwarehouse/screens as SubWarehouse* files, and the
 * Main Warehouse had a parallel set in admin/screens/dashboard
 * (MainWarehouseProfile / EditProfile / ProfileUpdated / ChangePassword /
 * SignOutConfirm / SignedOut) that was never reachable. One set now serves both
 * warehouse roles.
 *
 * As in the other warehouse areas, the role difference is carried by `scope`
 * (warehouseId undefined = all warehouses, the Main view) and `can` (a
 * docs/rbac.json code check that only decides what to render; the server
 * enforces every action again, CLAUDE.md 2.1). These screens are about the
 * signed-in admin's OWN account (auth.*.own, notification.own.*), so they have
 * no warehouse selector; the scope only labels the account (Main = "All
 * Warehouses").
 */
export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';
import type { WarehouseScope } from '../finance-expenses/types';

/** The signed-in admin's own account, as the profile and settings screens show it. */
export interface AdminAccountProfile {
  fullName: string;
  /** 'Sub Warehouse Admin' / 'Main Warehouse Admin' (derived from scope, see roleLabelOf). */
  roleLabel: string;
  adminId: string;
  /** Locked identity field: shown, never edited here (SPEC_GAPS W4l-2). */
  mobileNumber: string;
  email: string;
  /** Warehouse the account is scoped to, or 'All Warehouses' for Main. */
  warehouseLabel: string;
  accessLevel: string;
  createdDate: string;
  lastLogin: string;
  /** Display date the password was last changed. */
  passwordChanged: string;
  status: 'Active' | 'Inactive';
}

/** Preferred language options (the Sub profile design). */
export type ProfileLanguage = 'English' | 'Tamil';

/** One row of the login history (Session & Security). */
export interface LoginHistoryItem {
  id: string;
  device: string;
  time: string;
  result: 'Successful' | 'Failed';
}

/** The device this session runs on (Session & Security). */
export interface CurrentSessionInfo {
  device: string;
  browser: string;
  location: string;
  started: string;
  lastActive: string;
  /** Masked session id. */
  sessionId: string;
}

/** One help-centre FAQ. */
export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export type FaqCategory =
  | 'Getting Started'
  | 'Warehouse Operations'
  | 'Orders'
  | 'Inventory'
  | 'Billing'
  | 'Wallet'
  | 'Reports'
  | 'Account & Security';

/** One support request in the help centre's ticket list. */
export interface SupportTicketItem {
  id: string;
  subject: string;
  category: FaqCategory;
  openedOn: string;
  status: 'Open' | 'Under Review' | 'Resolved';
}

/** Legal pages of the About screen. */
export type AboutView = 'main' | 'privacy' | 'terms' | 'licenses';

/**
 * Routes of ProfileFlow (the Settings hub and everything reached from it, plus
 * the warehouse-facing profile screens of part B).
 * The old App.tsx keys map onto these (PROFILE_ROUTE_ENTRY in App.tsx).
 * 'ChangePassword' renders the Settings screen's inline change-password state
 * (the owner dropped the standalone Main stub, SPEC_GAPS W4l-1).
 * 'WarehouseSettings' is Main-only (warehouse.capacity.set); the flow renders
 * nothing for it without that code.
 */
export type ProfileRoute =
  | 'Settings'
  | 'ChangePassword'
  | 'UserProfile'
  | 'NotificationSettings'
  | 'Security'
  | 'SessionSecurity'
  | 'HelpSupport'
  | 'About'
  | 'WarehouseProfile'
  | 'StorageInfo'
  | 'OperatingInfo'
  | 'Contact'
  | 'Documents'
  | 'WarehouseSettings';

// ─── Part B: warehouse-facing profile screens ────────────────────────────────
//
// The warehouse profile, storage, operating, contact and documents screens are
// read-only for both roles (no rbac code exists for warehouse master data,
// SPEC_GAPS W4m-1). Every record carries the `warehouseId` it belongs to: a Sub
// scope shows its own warehouse (locked pill), Main picks one of the four (or,
// on Storage and Documents, all of them) with the selector.

/** Props of the warehouse-facing screens that follow the Main selector. */
export interface WarehouseSelectionProps {
  /** Warehouses Main can pick from (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Main's current pick; undefined = all warehouses (or the first one where "all" means nothing). */
  selectedWarehouseId?: string | undefined;
  onSelectWarehouse?: ((warehouseId: string | undefined) => void) | undefined;
}

/** Identity and overview of one warehouse (Warehouse Profile, design M15-S01). */
export interface WarehouseProfileInfo {
  warehouseId: string;
  warehouseName: string;
  /** Display code, e.g. 'WH-COO-001'. */
  code: string;
  status: 'Active' | 'Inactive';
  kind: 'Main Warehouse' | 'Sub Warehouse';
  region: string;
  assignedAdmin: string;
  address: string;
  /** Map pin label, e.g. '11.3530° N, 76.7959° E'. */
  coordinates: string;
  /** Long address line for the map sheet. */
  mapAddress: string;
  currentStock: string;
}

export type StorageType = 'Cold Storage' | 'Dry Storage' | 'Bulk Storage' | 'Staging Area';

/** One storage location of a warehouse (Storage Information, M4-S03). */
export interface StorageLocationItem {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  type: StorageType;
  status: 'Active' | 'Inactive';
  capacityKg: number;
  currentKg: number;
}

/** One storage section with its fill level (the absorbed M3S08 Storage Location Stock). */
export interface StorageSectionItem {
  id: string;
  warehouseId: string;
  type: StorageType;
  name: string;
  /** '3 racks · 2 products stored' or the batch on that shelf. */
  meta: string;
  fillPercent: number;
}

/**
 * One node of the storage hierarchy (warehouse > storage type > section >
 * rack/shelf), the absorbed StorageLocationsScreen browser (Main only).
 */
export interface StorageHierarchyNode {
  label: string;
  children?: readonly StorageHierarchyNode[] | undefined;
}

/** Hours of one weekday; `hours` undefined = closed. */
export interface OperatingDay {
  day: string;
  hours?: string | undefined;
}

/** Operating information of one warehouse (Operating Information). */
export interface OperatingInfo {
  warehouseId: string;
  status: 'Operational' | 'Closed';
  week: readonly OperatingDay[];
  services: readonly string[];
  fulfillment: readonly { label: string; value: string }[];
  dailyCapacity: readonly { label: string; value: string }[];
  specialDays: readonly { date: string; note: string }[];
  notes: string;
}

/** A named person with a phone number (contact person, emergency contact). */
export interface ContactPerson {
  name: string;
  role?: string | undefined;
  phone: string;
}

/** Contact details of one warehouse (Warehouse Contact). */
export interface WarehouseContactInfo {
  warehouseId: string;
  phone: string;
  email: string;
  address: string;
  /** Shown only when configured (the design: never invented). */
  contactPerson?: ContactPerson | undefined;
  /** Shown only when configured (not mandatory). */
  emergency?: ContactPerson | undefined;
}

export type DocumentCategory = 'Registration' | 'Compliance' | 'License' | 'Other';

/** One warehouse document (Warehouse Documents, M15-S05). */
export interface WarehouseDocItem {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  category: DocumentCategory;
  status: 'Active' | 'Expiring Soon';
  dateNote: string;
  /** Expiry for the detail view ('31 Dec 2026'); undefined when the document does not expire. */
  expiry?: string | undefined;
}

/** Threshold and operating configuration of one warehouse (Warehouse Settings, M15-S05T). */
export interface WarehouseSettingsValues {
  warehouseId: string;
  capacityKg: number;
  lowStockThresholdPercent: number;
  operatingHours: string;
  assignedStaff: number;
  autoAssignment: boolean;
  lowStockAlerts: boolean;
  discrepancyEscalation: boolean;
  /** Quantity-mismatch share above which the escalation rule fires (display; server-owned). */
  escalationThresholdPercent: number;
}
