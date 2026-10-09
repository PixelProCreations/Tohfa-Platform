/**
 * Mock data for the warehouse account screens until they call the API
 * (GET /auth/me for the profile; no session-list, preference or support-ticket
 * endpoint exists yet: SPEC_GAPS W4l-3/-5).
 *
 * Nothing here names a warehouse: the Sub profile takes its warehouse from the
 * scope, and Main is "All Warehouses" (the owner's decision: Main `own` = all
 * four warehouses).
 */
import type {
  AdminAccountProfile,
  CurrentSessionInfo,
  FaqItem,
  LoginHistoryItem,
  SupportTicketItem,
  WarehouseScope,
} from './types';

/** Main Warehouse view: no warehouseId means every warehouse. */
export function isMainScope(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/** Role title of the signed-in warehouse admin. */
export function roleLabelOf(scope: WarehouseScope): string {
  return isMainScope(scope) ? 'Main Warehouse Admin' : 'Sub Warehouse Admin';
}

/** What the account is scoped to: 'All Warehouses' for Main, else the warehouse name. */
export function scopeLabelOf(scope: WarehouseScope): string {
  if (isMainScope(scope)) return 'All Warehouses';
  return scope.warehouseName ?? scope.warehouseId ?? '';
}

/**
 * The signed-in admin's profile for a scope. Main is the absorbed
 * MainWarehouseProfileScreen's account (Rajesh Kumar, ADM-MWA-0007); Sub is the
 * Sub profile's account, with its admin id and warehouse derived from the scope
 * instead of a hard-coded warehouse.
 */
export function defaultProfile(scope: WarehouseScope): AdminAccountProfile {
  if (isMainScope(scope)) {
    return {
      fullName: 'Rajesh Kumar',
      roleLabel: roleLabelOf(scope),
      adminId: 'ADM-MWA-0007',
      mobileNumber: '+91 98765 43211',
      email: 'rajesh.kumar@tohfa.org',
      warehouseLabel: scopeLabelOf(scope),
      accessLevel: 'Warehouse Management',
      createdDate: '02 Jan 2026',
      lastLogin: 'Today, 8:52 AM',
      passwordChanged: '14 Aug 2026',
      status: 'Active',
    };
  }
  return {
    fullName: 'Suresh',
    roleLabel: roleLabelOf(scope),
    adminId: `SWA-${scope.warehouseId ?? ''}-001`,
    mobileNumber: '+91 98765 43210',
    email: 'suresh@tohfa.ag',
    warehouseLabel: scopeLabelOf(scope),
    accessLevel: 'Warehouse Operations',
    createdDate: '10 Feb 2026',
    lastLogin: 'Today, 8:42 AM',
    passwordChanged: '12 Aug 2026',
    status: 'Active',
  };
}

export const CURRENT_SESSION: CurrentSessionInfo = {
  device: 'Windows Desktop',
  browser: 'Chrome',
  location: 'Nilgiris, TN',
  started: '08:42 AM',
  lastActive: '09:42 AM',
  sessionId: 'SESSION-••••',
};

export const LOGIN_HISTORY: readonly LoginHistoryItem[] = [
  { id: 'LH-1', device: 'Chrome · Windows', time: 'Today · 08:42 AM', result: 'Successful' },
  { id: 'LH-2', device: 'Android App', time: 'Yesterday · 04:15 PM', result: 'Successful' },
  { id: 'LH-3', device: 'Chrome · Windows', time: '06 Oct · 09:30 AM', result: 'Successful' },
];

export const SUPPORT_TICKETS: readonly SupportTicketItem[] = [
  { id: 'SUP-00245', subject: 'Unable to generate invoice', category: 'Billing', openedOn: '25 Sep 2026', status: 'Under Review' },
];

/** Help-centre contact details (the Sub design's helpline and mailbox). */
export const SUPPORT_CONTACT = {
  phone: '+91 1800-845-6677',
  phoneHours: 'Toll Free · 8 AM - 8 PM',
  email: 'support@tohfa.in',
  emailHours: '24/7 Response',
} as const;

/** About screen facts. */
export const APP_INFO = {
  application: 'TOHFA Admin App',
  version: '1.0.0',
  build: '100',
  environment: 'Production',
} as const;

/**
 * Help-centre FAQs (the Sub design's 24 questions). Answers that named the
 * Sub warehouse now say "your assigned warehouse"; the Main admin sees the same
 * help (the menus are shared).
 */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'gs-1',
    category: 'Getting Started',
    question: 'How do I navigate the warehouse admin dashboard?',
    answer:
      'Use the bottom navigation bar to switch between Home, Receiving, Inventory, and More. The Home dashboard provides high-level cards for today’s receiving schedule, customer dispatch orders, and warehouse capacity.',
  },
  {
    id: 'gs-2',
    category: 'Getting Started',
    question: 'What are the main duties of a warehouse admin?',
    answer:
      'Warehouse admins log inbound produce batches from farmers, perform quality grading, update inventory storage, fulfill customer orders, and manage daily warehouse cash and expenses.',
  },
  {
    id: 'gs-3',
    category: 'Getting Started',
    question: 'How do I switch or view my assigned warehouse facility?',
    answer:
      'Your account is linked to your assigned warehouse (Main Warehouse admins see all warehouses). Warehouse assignment is controlled by Super Admin RBAC policies.',
  },
  {
    id: 'wo-1',
    category: 'Warehouse Operations',
    question: 'How do I log a warehouse operational expense?',
    answer:
      'Navigate to More > Finance & Expenses > Add Expense. Enter the amount, select an expense category (Packaging, Fuel, Utilities, Labour, Maintenance), and attach the receipt photo.',
  },
  {
    id: 'wo-2',
    category: 'Warehouse Operations',
    question: 'How do I monitor warehouse storage zones and crate capacity?',
    answer: 'Go to More > Warehouse Operations > Storage Info to view Cold Storage, Ambient Dry Storage, and Staging Bay capacity percentages.',
  },
  {
    id: 'wo-3',
    category: 'Warehouse Operations',
    question: 'How do I mark daily staff attendance and shifts?',
    answer: 'Open More > Warehouse Staff > Staff & Attendance to mark employee attendance, check-in times, and assign warehouse duty shifts.',
  },
  {
    id: 'ord-1',
    category: 'Orders',
    question: "How do I view and filter today's customer orders?",
    answer:
      'Open Customer Orders from the More menu or Home dashboard. Use the filter chips (Pending, Picked, Dispatched, Fulfilled) to view order status.',
  },
  {
    id: 'ord-2',
    category: 'Orders',
    question: 'How do I process customer pickup orders?',
    answer:
      'Scan or enter the Order ID, verify payment confirmation or customer wallet deduction, inspect packed crates, and tap "Confirm Handover".',
  },
  {
    id: 'ord-3',
    category: 'Orders',
    question: 'How do I handle customer cancellation or item returns?',
    answer:
      'Go to More > Returns & Issues > Review Return Request to verify customer return items, check produce quality, and issue instant wallet credit.',
  },
  {
    id: 'inv-1',
    category: 'Inventory',
    question: 'How do I record newly received farm produce?',
    answer:
      'Go to the Receiving tab, tap "New Goods Receipt", select the farmer batch or intake manifest, record weighed crates, and print barcode bin tags.',
  },
  {
    id: 'inv-2',
    category: 'Inventory',
    question: 'How do I report damaged or spoilt produce?',
    answer:
      'Navigate to More > Returns & Issues > Report Issue. Select "Inventory" issue type, enter damaged quantity, and attach crate photos for audit clearance.',
  },
  {
    id: 'inv-3',
    category: 'Inventory',
    question: 'How do I perform physical stock reconciliation?',
    answer:
      'Open the Inventory bottom tab, tap "Stock Reconciliation", enter counted physical crate quantities against system ledger count, and submit for verification.',
  },
  {
    id: 'bil-1',
    category: 'Billing',
    question: 'How do I generate a GST tax invoice?',
    answer:
      'Open More > Billing & Invoices > Generate Invoice. Select the customer or B2B buyer, add products with HSN code, and calculate SGST/CGST breakdown.',
  },
  {
    id: 'bil-2',
    category: 'Billing',
    question: 'How do I download or print an invoice receipt?',
    answer: 'In More > Billing & Invoices > Invoice History, tap any invoice record and choose "Download PDF" or "Thermal Print".',
  },
  {
    id: 'bil-3',
    category: 'Billing',
    question: 'Can I issue a credit note for disputed orders?',
    answer: 'Yes, navigate to Billing > Invoices > Select Invoice > Issue Credit Note to adjust previous billing records.',
  },
  {
    id: 'wal-1',
    category: 'Wallet',
    question: 'How do I process a customer wallet cash top-up?',
    answer:
      'Go to More > Wallet & Cash Top-Up > New Top-Up. Search customer by phone number, receive physical cash, and confirm wallet balance credit.',
  },
  {
    id: 'wal-2',
    category: 'Wallet',
    question: 'How do I process a wallet refund for a customer?',
    answer: 'Open More > Wallet & Cash Top-Up > Customer Search, locate the customer wallet transaction, and tap "Initiate Refund".',
  },
  {
    id: 'wal-3',
    category: 'Wallet',
    question: 'Where can I see the daily cash collection summary?',
    answer: 'Go to More > Finance > Daily Cash Summary to reconcile total cash collected in till vs bank deposit slips.',
  },
  {
    id: 'rep-1',
    category: 'Reports',
    question: 'How do I export sales and dispatch reports?',
    answer:
      'Navigate to More > Reports > Sales Report. Choose date range (Daily, Weekly, Monthly) and tap "Export Excel" or "View Analytics".',
  },
  {
    id: 'rep-2',
    category: 'Reports',
    question: 'How do I track produce wastage and shrinkage rates?',
    answer: 'Open More > Reports > Shrinkage Report to view percentage weight loss, transit damage, and storage decay trends.',
  },
  {
    id: 'rep-3',
    category: 'Reports',
    question: 'How do I generate the warehouse operational audit report?',
    answer: 'Go to More > Reports > Financial Reports to download the complete ledger of revenue, staff wages, and operational costs.',
  },
  {
    id: 'sec-1',
    category: 'Account & Security',
    question: 'How do I change my account login password?',
    answer:
      'Go to Settings > Security > Change Password. Enter your current password and a new password, then tap "Update Password".',
  },
  {
    id: 'sec-2',
    category: 'Account & Security',
    question: 'How do I review active login devices and sessions?',
    answer:
      'Open Settings > Session & Security to view the current device, login timestamps and history, and tap "Logout Current Session" if needed.',
  },
  {
    id: 'sec-3',
    category: 'Account & Security',
    question: 'What should I do if I suspect unauthorized access?',
    answer: 'Log out your current session from Session & Security, change your password, and contact the support helpline.',
  },
];
