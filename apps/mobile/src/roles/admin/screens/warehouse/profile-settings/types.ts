/**
 * Shared types for the warehouse account screens (design module M16, part A):
 * the Settings hub, the admin's own profile, notification preferences,
 * security, session & security, help & support and about.
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
 * Routes of ProfileFlow (the Settings hub and everything reached from it).
 * The old App.tsx keys map onto these (PROFILE_ROUTE_ENTRY in App.tsx).
 * 'ChangePassword' renders the Settings screen's inline change-password state
 * (the owner dropped the standalone Main stub, SPEC_GAPS W4l-1).
 */
export type ProfileRoute =
  | 'Settings'
  | 'ChangePassword'
  | 'UserProfile'
  | 'NotificationSettings'
  | 'Security'
  | 'SessionSecurity'
  | 'HelpSupport'
  | 'About';
