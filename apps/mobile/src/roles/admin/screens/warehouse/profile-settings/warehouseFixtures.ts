/**
 * Mock warehouse master data for the warehouse-facing profile screens (part B)
 * until they call the API. GET /warehouses and /warehouses/{id}
 * (warehouse.all.view, docs/openapi.yaml) return only id/code/name/type/city/
 * capacityKg; there is no endpoint for storage locations, operating hours,
 * contacts, documents or warehouse settings yet (SPEC_GAPS W4m-1..-4).
 *
 * Unlike ./fixtures.ts (the admin's own account), these rows DO name
 * warehouses: they are the data, keyed by the four seeded warehouse ids the
 * other areas use (billing-invoices BILLING_WAREHOUSES). Screens never name a
 * warehouse themselves; a Sub scope sees the rows of its own warehouseId, Main
 * all four (owner decision: Main `own` = all four warehouses).
 */
import type {
  OperatingDay,
  OperatingInfo,
  StorageHierarchyNode,
  StorageLocationItem,
  StorageSectionItem,
  WarehouseContactInfo,
  WarehouseDocItem,
  WarehouseProfileInfo,
  WarehouseScope,
  WarehouseSettingsValues,
} from './types';

/** The four seeded warehouses, for the Main selector. */
export const PROFILE_WAREHOUSES: readonly WarehouseScope[] = [
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty Warehouse' },
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' },
  { warehouseId: 'WH-KOTA', warehouseName: 'Kotagiri Warehouse' },
  { warehouseId: 'WH-GUDA', warehouseName: 'Gudalur Market Warehouse' },
];

export const WAREHOUSE_PROFILES: readonly WarehouseProfileInfo[] = [
  {
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty Warehouse',
    code: 'WH-OOT-001',
    status: 'Active',
    kind: 'Main Warehouse',
    region: 'Nilgiris',
    assignedAdmin: 'MWA – Ooty',
    address: 'Ooty, Nilgiris, Tamil Nadu, India',
    coordinates: '11.4102° N, 76.6950° E',
    mapAddress: 'Ooty Agricultural Hub, Charing Cross, Ooty, Nilgiris - 643001',
    currentStock: '18,920 kg',
  },
  {
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    code: 'WH-COO-001',
    status: 'Active',
    kind: 'Sub Warehouse',
    region: 'Nilgiris',
    assignedAdmin: 'SWA – Coonoor',
    address: 'Coonoor, Nilgiris, Tamil Nadu, India',
    coordinates: '11.3530° N, 76.7959° E',
    mapAddress: 'Coonoor Agricultural Hub, Bedford, Coonoor, Nilgiris - 643101',
    currentStock: '12,480 kg',
  },
  {
    warehouseId: 'WH-KOTA',
    warehouseName: 'Kotagiri Warehouse',
    code: 'WH-KOT-001',
    status: 'Active',
    kind: 'Sub Warehouse',
    region: 'Nilgiris',
    assignedAdmin: 'SWA – Kotagiri',
    address: 'Kotagiri, Nilgiris, Tamil Nadu, India',
    coordinates: '11.4216° N, 76.8616° E',
    mapAddress: 'Kotagiri Market Road, Kotagiri, Nilgiris - 643217',
    currentStock: '6,310 kg',
  },
  {
    warehouseId: 'WH-GUDA',
    warehouseName: 'Gudalur Market Warehouse',
    code: 'WH-GUD-001',
    status: 'Active',
    kind: 'Sub Warehouse',
    region: 'Nilgiris',
    assignedAdmin: 'SWA – Gudalur',
    address: 'Gudalur, Nilgiris, Tamil Nadu, India',
    coordinates: '11.5030° N, 76.4917° E',
    mapAddress: 'Gudalur Market Yard, Gudalur, Nilgiris - 643212',
    currentStock: '4,870 kg',
  },
];

/** Storage locations: the Sub design's five (Coonoor) plus a few for the other warehouses. */
export const STORAGE_LOCATIONS: readonly StorageLocationItem[] = [
  { id: 'CS-A01', warehouseId: 'WH-COON', name: 'Cold Storage A', code: 'CS-A01', type: 'Cold Storage', status: 'Active', capacityKg: 2000, currentKg: 1650 },
  { id: 'DS-B01', warehouseId: 'WH-COON', name: 'Dry Storage B', code: 'DS-B01', type: 'Dry Storage', status: 'Active', capacityKg: 3000, currentKg: 2200 },
  { id: 'CS-C01', warehouseId: 'WH-COON', name: 'Cold Storage C', code: 'CS-C01', type: 'Cold Storage', status: 'Active', capacityKg: 1500, currentKg: 1120 },
  { id: 'BS-D01', warehouseId: 'WH-COON', name: 'Bulk Storage D', code: 'BS-D01', type: 'Bulk Storage', status: 'Active', capacityKg: 2500, currentKg: 1850 },
  { id: 'SA-E01', warehouseId: 'WH-COON', name: 'Staging Area E', code: 'SA-E01', type: 'Staging Area', status: 'Inactive', capacityKg: 1000, currentKg: 600 },
  { id: 'OCS-A01', warehouseId: 'WH-OOTY', name: 'Cold Storage A', code: 'OCS-A01', type: 'Cold Storage', status: 'Active', capacityKg: 4000, currentKg: 3100 },
  { id: 'ODS-B01', warehouseId: 'WH-OOTY', name: 'Dry Storage B', code: 'ODS-B01', type: 'Dry Storage', status: 'Active', capacityKg: 6000, currentKg: 4400 },
  { id: 'KCS-A01', warehouseId: 'WH-KOTA', name: 'Cold Storage A', code: 'KCS-A01', type: 'Cold Storage', status: 'Active', capacityKg: 1500, currentKg: 900 },
  { id: 'KDS-B01', warehouseId: 'WH-KOTA', name: 'Dry Storage B', code: 'KDS-B01', type: 'Dry Storage', status: 'Active', capacityKg: 2000, currentKg: 0 },
  { id: 'GDS-A01', warehouseId: 'WH-GUDA', name: 'Dry Storage A', code: 'GDS-A01', type: 'Dry Storage', status: 'Active', capacityKg: 2500, currentKg: 1700 },
];

/** Section fill levels (the absorbed M3S08 Storage Location Stock). */
export const STORAGE_SECTIONS: readonly StorageSectionItem[] = [
  { id: 'coon-cs-a', warehouseId: 'WH-COON', type: 'Cold Storage', name: 'Section A', meta: '3 racks · 2 products stored', fillPercent: 75 },
  { id: 'coon-cs-b', warehouseId: 'WH-COON', type: 'Cold Storage', name: 'Section B', meta: '4 racks · 3 products stored', fillPercent: 92 },
  { id: 'coon-cs-a-r03', warehouseId: 'WH-COON', type: 'Cold Storage', name: 'Section A · Rack 03 · Shelf 03', meta: 'BAT-COO-00241 · Tomato · Grade 1', fillPercent: 65 },
  { id: 'coon-ds-c', warehouseId: 'WH-COON', type: 'Dry Storage', name: 'Section C', meta: '2 racks · 0 products stored', fillPercent: 0 },
  { id: 'ooty-cs-a', warehouseId: 'WH-OOTY', type: 'Cold Storage', name: 'Section A', meta: '5 racks · 4 products stored', fillPercent: 78 },
  { id: 'kota-ds-b', warehouseId: 'WH-KOTA', type: 'Dry Storage', name: 'Section B', meta: '2 racks · 0 products stored', fillPercent: 0 },
  { id: 'guda-ds-a', warehouseId: 'WH-GUDA', type: 'Dry Storage', name: 'Section A', meta: '3 racks · 2 products stored', fillPercent: 68 },
];

/** Storage hierarchy per warehouse (the absorbed StorageLocationsScreen browser, Main only). */
export const STORAGE_HIERARCHY: Readonly<Record<string, readonly StorageHierarchyNode[]>> = {
  'WH-COON': [
    {
      label: 'Cold Storage',
      children: [
        { label: 'Section A', children: [{ label: 'Rack 01 → Shelf 01 / Shelf 02' }, { label: 'Rack 02 → Shelf 01 / Shelf 02' }] },
        { label: 'Section B', children: [{ label: 'Rack 01 → Shelf 01 / Shelf 02 / Shelf 03' }] },
      ],
    },
    { label: 'Dry Storage', children: [{ label: 'Section C', children: [{ label: 'Rack 01 → Shelf 01' }] }] },
  ],
  'WH-OOTY': [
    { label: 'Cold Storage', children: [{ label: 'Section A', children: [{ label: 'Rack 01 → Shelf 01 / Shelf 02' }] }] },
    { label: 'Dry Storage', children: [{ label: 'Section B', children: [{ label: 'Rack 01 → Shelf 01 / Shelf 02' }] }] },
  ],
  'WH-KOTA': [{ label: 'Dry Storage', children: [{ label: 'Section B', children: [{ label: 'Rack 01 → Shelf 01' }] }] }],
  'WH-GUDA': [{ label: 'Dry Storage', children: [{ label: 'Section A', children: [{ label: 'Rack 01 → Shelf 01 / Shelf 02' }] }] }],
};

const WEEKDAY_HOURS = '09:00 AM – 06:00 PM';

function week(saturday: string): readonly OperatingDay[] {
  return [
    { day: 'Monday', hours: WEEKDAY_HOURS },
    { day: 'Tuesday', hours: WEEKDAY_HOURS },
    { day: 'Wednesday', hours: WEEKDAY_HOURS },
    { day: 'Thursday', hours: WEEKDAY_HOURS },
    { day: 'Friday', hours: WEEKDAY_HOURS },
    { day: 'Saturday', hours: saturday },
    { day: 'Sunday' },
  ];
}

function operating(warehouseId: string, saturday: string, ordersPerDay: string): OperatingInfo {
  return {
    warehouseId,
    status: 'Operational',
    week: week(saturday),
    services: ['Customer Pickup', 'Market Sales', 'Cash Top-Up', 'Goods Receiving', 'Order Fulfillment'],
    fulfillment: [
      { label: 'Customer Pickup', value: 'Available' },
      { label: 'Home Delivery', value: 'Available' },
      { label: 'Market Sales', value: 'Available' },
    ],
    dailyCapacity: [
      { label: 'Orders', value: ordersPerDay },
      { label: 'Receiving', value: '50 receipts / day' },
      { label: 'Market Sales', value: '180 / day' },
    ],
    specialDays: [
      { date: '25 Dec', note: 'Closed' },
      { date: '01 Jan', note: 'Closed' },
    ],
    notes: 'Warehouse-specific operational information configured by authorized administration.',
  };
}

export const OPERATING_INFO: readonly OperatingInfo[] = [
  operating('WH-OOTY', '09:00 AM – 05:00 PM', '540 / day'),
  operating('WH-COON', '09:00 AM – 05:00 PM', '320 / day'),
  operating('WH-KOTA', '09:00 AM – 01:00 PM', '160 / day'),
  operating('WH-GUDA', '09:00 AM – 01:00 PM', '140 / day'),
];

export const WAREHOUSE_CONTACTS: readonly WarehouseContactInfo[] = [
  {
    warehouseId: 'WH-OOTY',
    phone: '+91 94421 80010',
    email: 'ooty.warehouse@example.com',
    address: 'Ooty, Nilgiris, Tamil Nadu, India',
    contactPerson: { name: 'Rajesh Kumar', role: 'Warehouse Contact', phone: '+91 94421 80011' },
    emergency: { name: 'Regional Ops Desk', phone: '+91 91122 33445' },
  },
  {
    warehouseId: 'WH-COON',
    phone: '+91 94421 88210',
    email: 'warehouse@example.com',
    address: 'Coonoor, Nilgiris, Tamil Nadu, India',
    contactPerson: { name: 'Ganesh Kumar', role: 'Warehouse Contact', phone: '+91 94421 88211' },
    emergency: { name: 'Regional Ops Desk', phone: '+91 91122 33445' },
  },
  {
    warehouseId: 'WH-KOTA',
    phone: '+91 94421 86120',
    email: 'kotagiri.warehouse@example.com',
    address: 'Kotagiri, Nilgiris, Tamil Nadu, India',
    contactPerson: { name: 'Priya S', role: 'Warehouse Contact', phone: '+91 94421 86121' },
  },
  {
    warehouseId: 'WH-GUDA',
    phone: '+91 94421 84230',
    email: 'gudalur.warehouse@example.com',
    address: 'Gudalur, Nilgiris, Tamil Nadu, India',
  },
];

function docsFor(warehouseId: string, prefix: string, start: number): WarehouseDocItem[] {
  const code = (n: number) => `${prefix}-${String(start + n).padStart(5, '0')}`;
  return [
    { id: `${warehouseId}-1`, warehouseId, name: 'Warehouse Registration', code: code(0), category: 'Registration', status: 'Active', dateNote: 'Issued 01 Jan 2026 · Expires 31 Dec 2026', expiry: '31 Dec 2026' },
    { id: `${warehouseId}-2`, warehouseId, name: 'Compliance Document', code: code(1), category: 'Compliance', status: 'Expiring Soon', dateNote: 'Expires 15 Oct 2026', expiry: '15 Oct 2026' },
    { id: `${warehouseId}-3`, warehouseId, name: 'FSSAI Food Storage License', code: code(2), category: 'License', status: 'Active', dateNote: 'Issued 15 Feb 2025 · Expires 14 Feb 2028', expiry: '14 Feb 2028' },
    { id: `${warehouseId}-4`, warehouseId, name: 'Fire Safety Certificate', code: code(3), category: 'Compliance', status: 'Active', dateNote: 'Valid till 30 Nov 2026', expiry: '30 Nov 2026' },
  ];
}

export const WAREHOUSE_DOCUMENTS: readonly WarehouseDocItem[] = [
  ...docsFor('WH-COON', 'DOC', 125),
  { id: 'WH-COON-5', warehouseId: 'WH-COON', name: 'Pollution Control Board NOC', code: 'DOC-00129', category: 'Compliance', status: 'Active', dateNote: 'Valid till 31 Dec 2027', expiry: '31 Dec 2027' },
  { id: 'WH-COON-6', warehouseId: 'WH-COON', name: 'Municipal Trade License', code: 'DOC-00130', category: 'License', status: 'Active', dateNote: 'Issued 01 Apr 2025 · Expires 31 Mar 2027', expiry: '31 Mar 2027' },
  { id: 'WH-COON-7', warehouseId: 'WH-COON', name: 'Commercial Property Insurance', code: 'DOC-00131', category: 'Other', status: 'Active', dateNote: 'Valid till 15 Aug 2027', expiry: '15 Aug 2027' },
  { id: 'WH-COON-8', warehouseId: 'WH-COON', name: 'Weight & Measures Inspection', code: 'DOC-00132', category: 'Other', status: 'Active', dateNote: 'Verified 10 Jan 2026 · Valid 1 Year' },
  ...docsFor('WH-OOTY', 'DOC', 201),
  ...docsFor('WH-KOTA', 'DOC', 301),
  ...docsFor('WH-GUDA', 'DOC', 401),
];

/**
 * Warehouse settings. Display values only: the real low-stock threshold and
 * capacity live server-side (warehouses.capacityKg; no threshold or hours
 * endpoint, SPEC_GAPS W4m-4), never in a screen constant.
 */
export const WAREHOUSE_SETTINGS: readonly WarehouseSettingsValues[] = [
  { warehouseId: 'WH-OOTY', capacityKg: 12000, lowStockThresholdPercent: 25, operatingHours: '6:00 AM – 6:00 PM', assignedStaff: 4, autoAssignment: true, lowStockAlerts: true, discrepancyEscalation: true, escalationThresholdPercent: 10 },
  { warehouseId: 'WH-COON', capacityKg: 10000, lowStockThresholdPercent: 25, operatingHours: '6:00 AM – 6:00 PM', assignedStaff: 2, autoAssignment: true, lowStockAlerts: true, discrepancyEscalation: true, escalationThresholdPercent: 10 },
  { warehouseId: 'WH-KOTA', capacityKg: 6000, lowStockThresholdPercent: 25, operatingHours: '6:00 AM – 6:00 PM', assignedStaff: 2, autoAssignment: true, lowStockAlerts: true, discrepancyEscalation: true, escalationThresholdPercent: 10 },
  { warehouseId: 'WH-GUDA', capacityKg: 4000, lowStockThresholdPercent: 20, operatingHours: '7:00 AM – 2:00 PM', assignedStaff: 1, autoAssignment: false, lowStockAlerts: true, discrepancyEscalation: true, escalationThresholdPercent: 10 },
];

/** Quick-pick low-stock thresholds offered in the settings editor (display presets, not a rule). */
export const THRESHOLD_PRESETS: readonly number[] = [15, 20, 25, 30];
