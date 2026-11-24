/**
 * Customer Management Module & Flow
 * Full module matching Tohfa Admin Customer Management (M1-S07 to M1-S11),
 * shared between Super Admin and Tohfa Admin.
 *
 * Screens included:
 *   1. CustomersManagementScreen (KPIs, Period filter, Recent customers, Quick action cards)
 *   2. CustomerDirectoryScreen (Directory listing, Search, Multi-criteria filter modal)
 *   3. AddCustomerScreen (Personal details, Address, Business info, Warehouse preference)
 *   4. CustomerDetailsScreen (CustomersFlow integration with CustomerDetails, Orders, Issues)
 *   5. GstBusinessScreen (GST & Business Accounts directory, Search, Filter)
 *   6. GstBusinessDetailScreen (GST details, Verification status, Invoices issued, Edit modal)
 */
import React, { useState, useEffect } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import { type Can } from '../../permissions/can';
import { CustomersFlow, CUSTOMER_WAREHOUSES } from '../warehouse/customers';

// ─── Module SVG Icons ─────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CustomersManagementHeaderIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.2" fill={color} />
      <Circle cx="9" cy="12" r="2.2" fill={color} />
      <Circle cx="16" cy="18" r="2.2" fill={color} />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CircularFilterButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={customerStyles.circularHeaderBtn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Filter customers"
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Line x1="4" y1="6" x2="20" y2="6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
        <Line x1="4" y1="12" x2="20" y2="12" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
        <Line x1="4" y1="18" x2="20" y2="18" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="15" cy="6" r="2.2" fill={adminColors.onBrand} />
        <Circle cx="9" cy="12" r="2.2" fill={adminColors.onBrand} />
        <Circle cx="16" cy="18" r="2.2" fill={adminColors.onBrand} />
      </Svg>
    </TouchableOpacity>
  );
}

function CircularPlusButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={customerStyles.circularHeaderBtn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Add customer"
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M5 12h14" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" />
      </Svg>
    </TouchableOpacity>
  );
}

function CircularEditButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={customerStyles.circularHeaderBtn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Edit business details"
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          stroke={adminColors.onBrand}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke={adminColors.onBrand}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );
}

function CustomerDirectoryActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function GstBuildingActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="9" y1="6" x2="9" y2="6.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="6" x2="15" y2="6.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="9" y1="10" x2="9" y2="10.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="10" x2="15" y2="10.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="9" y1="14" x2="9" y2="14.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="14" x2="15" y2="14.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M10 22v-4h4v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types & Fixtures ───────────────────────────────────────────────────

export interface CustomerItem {
  id: string;
  name: string;
  type: 'Individual' | 'B2B';
  displayType?: 'online' | 'B2B';
  status: 'Active' | 'Pending activation' | 'Inactive';
  phone: string;
  email?: string;
  gstStatus?: string;
  preferredWarehouse: string;
  ordersVisible?: number;
  lastPurchase?: string;
  registrationDate?: string;
  pickupStates?: string;
  address?: string;
  isB2B?: boolean;
}

export interface GstBusinessItem {
  id: string;
  legalName: string;
  businessType: string;
  contactPerson: string;
  phone: string;
  email?: string;
  status: 'Recorded' | 'Incomplete';
  gstin: string;
  gstAddress: string;
  billingAddressLine1: string;
  billingAddressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  updatedDate: string;
  lastUpdatedFull?: string;
  missingInfo?: string;
  invoicesIssued?: string;
  subtext?: string;
}

export const DEFAULT_CUSTOMER: CustomerItem = {
  id: 'CUS-1012',
  name: 'Nilgiri Fresh Traders',
  type: 'B2B',
  displayType: 'B2B',
  status: 'Active',
  phone: '+91 90001 20149',
  email: '',
  gstStatus: 'GST Recorded',
  preferredWarehouse: 'Ooty',
  ordersVisible: 9,
  lastPurchase: '1 Oct 2026',
  registrationDate: '5 Jan 2025 · Added by admin',
  pickupStates: 'Ooty-Warehouse',
  address: '44 Industrial Estate, Ooty, Tamil Nadu 643005',
  isB2B: true,
};

export const CUSTOMERS_DATA: CustomerItem[] = [
  DEFAULT_CUSTOMER,
  {
    id: 'CUS-1013',
    name: 'Highland Agro Supplies',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0156',
    email: '',
    gstStatus: 'GST Missing',
    preferredWarehouse: 'Coonoor',
    ordersVisible: 1,
    lastPurchase: '30 Sep 2026',
    registrationDate: '12 Feb 2025 · Added by admin',
    pickupStates: 'Coonoor-Warehouse',
    address: '12 Hill Cart Road, Coonoor, Tamil Nadu 643101',
    isB2B: true,
  },
  {
    id: 'CUS-1001',
    name: 'Anitha Raman',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 90001 20149',
    email: '',
    gstStatus: 'Not applicable',
    preferredWarehouse: 'Ooty',
    ordersVisible: 2,
    lastPurchase: '27 Sep 2026',
    registrationDate: '5 Jan 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: '44 Industrial Estate, Ooty, Tamil Nadu 643005',
    isB2B: false,
  },
  {
    id: 'CUS-1011',
    name: 'Lakshmi Narayan',
    type: 'Individual',
    displayType: 'online',
    status: 'Pending activation',
    phone: '+91 ••••• 0164',
    email: '',
    gstStatus: 'Not applicable',
    preferredWarehouse: 'No preferred warehouse',
    ordersVisible: 0,
    lastPurchase: '',
    registrationDate: 'Reg. 13 Oct 2026',
    pickupStates: 'Ooty-Warehouse',
    address: '15 Fern Hill, Ooty, Tamil Nadu 643004',
    isB2B: false,
  },
  {
    id: 'CUS-1007',
    name: 'Priya Nair',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0157',
    email: '',
    gstStatus: 'Not applicable',
    preferredWarehouse: 'No preferred warehouse',
    ordersVisible: 0,
    lastPurchase: '',
    registrationDate: 'Reg. 12 Oct 2026',
    pickupStates: 'Ooty-Warehouse',
    address: '22 Garden Road, Ooty, Tamil Nadu 643001',
    isB2B: false,
  },
  {
    id: 'CUS-1015',
    name: 'Hotel Blue Hills',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0172',
    email: '',
    gstStatus: 'GST Recorded',
    preferredWarehouse: 'Ooty',
    ordersVisible: 6,
    lastPurchase: '8 Oct 2026',
    registrationDate: '20 Mar 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: '1 Lake Road, Ooty, Tamil Nadu 643001',
    isB2B: true,
  },
  {
    id: 'CUS-1018',
    name: 'Nilgiri Tea & Produce Co',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0188',
    email: '',
    gstStatus: 'GST Recorded',
    preferredWarehouse: 'Ooty',
    ordersVisible: 4,
    lastPurchase: '2 Oct 2026',
    registrationDate: '15 Apr 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: '12 Commercial Rd, Ooty, Tamil Nadu 643001',
    isB2B: true,
  },
  {
    id: 'CUS-1020',
    name: 'Western Ghats Cafe',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0195',
    email: '',
    gstStatus: 'GST Missing',
    preferredWarehouse: 'Ooty',
    ordersVisible: 3,
    lastPurchase: '1 Oct 2026',
    registrationDate: '2 May 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: '5 Charing Cross, Ooty, Tamil Nadu 643001',
    isB2B: true,
  },
  {
    id: 'CUS-1022',
    name: 'Green Valley Resorts',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0204',
    email: '',
    gstStatus: 'GST Recorded',
    preferredWarehouse: 'Ooty',
    ordersVisible: 5,
    lastPurchase: '28 Sep 2026',
    registrationDate: '10 May 2025 · Added by admin',
    pickupStates: 'Ooty-Warehouse',
    address: 'Elk Hill, Ooty, Tamil Nadu 643001',
    isB2B: true,
  },
  {
    id: 'CUS-1025',
    name: 'Hill Top Organics',
    type: 'B2B',
    displayType: 'B2B',
    status: 'Active',
    phone: '+91 ••••• 0219',
    email: '',
    gstStatus: 'GST Recorded',
    preferredWarehouse: 'Coonoor',
    ordersVisible: 2,
    lastPurchase: '25 Sep 2026',
    registrationDate: '18 May 2025 · Added by admin',
    pickupStates: 'Coonoor-Warehouse',
    address: 'Coonoor Rd, Ooty, Tamil Nadu 643002',
    isB2B: true,
  },
  {
    id: 'CUS-1002',
    name: 'Kavitha Sundaram',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0221',
    preferredWarehouse: 'Ooty',
    ordersVisible: 1,
    lastPurchase: '20 Sep 2026',
    registrationDate: '15 Jan 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1003',
    name: 'Ravi Chandran',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0233',
    preferredWarehouse: 'Ooty',
    ordersVisible: 4,
    lastPurchase: '18 Sep 2026',
    registrationDate: '18 Jan 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1004',
    name: 'Meena Krishnan',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0245',
    preferredWarehouse: 'Coonoor',
    ordersVisible: 1,
    lastPurchase: '15 Sep 2026',
    registrationDate: '22 Jan 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1005',
    name: 'Suresh Kumar',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0258',
    preferredWarehouse: 'Ooty',
    ordersVisible: 3,
    lastPurchase: '12 Sep 2026',
    registrationDate: '1 Feb 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1006',
    name: 'Divya Balaji',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0262',
    preferredWarehouse: 'Ooty',
    ordersVisible: 2,
    lastPurchase: '8 Sep 2026',
    registrationDate: '5 Feb 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1008',
    name: 'Rajesh Varma',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0270',
    preferredWarehouse: 'Kotagiri',
    ordersVisible: 1,
    lastPurchase: '5 Sep 2026',
    registrationDate: '12 Feb 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1009',
    name: 'Deepa Natarajan',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0284',
    preferredWarehouse: 'Ooty',
    ordersVisible: 2,
    lastPurchase: '1 Sep 2026',
    registrationDate: '20 Feb 2025',
    isB2B: false,
  },
  {
    id: 'CUS-1010',
    name: 'Saravanan Muthu',
    type: 'Individual',
    displayType: 'online',
    status: 'Active',
    phone: '+91 ••••• 0299',
    preferredWarehouse: 'Ooty',
    ordersVisible: 1,
    lastPurchase: '28 Aug 2026',
    registrationDate: '1 Mar 2025',
    isB2B: false,
  },
];

export const DEFAULT_GST_BUSINESS: GstBusinessItem = {
  id: 'CUS-1012',
  legalName: 'Nilgiri Fresh Traders Pvt Ltd',
  businessType: 'Wholesale trader',
  contactPerson: 'Mr. Sundar',
  phone: '9000012345',
  email: '',
  status: 'Recorded',
  gstin: '33AABCN1234F1Z5',
  gstAddress: '44 Industrial Estate, Ooty',
  billingAddressLine1: '44 Industrial Estate',
  billingAddressLine2: '',
  city: 'Ooty',
  state: 'Tamil Nadu',
  pinCode: '643005',
  country: 'India',
  updatedDate: '5 Oct 2026',
  lastUpdatedFull: '5 Oct 2026, 10:00',
  missingInfo: 'None',
  invoicesIssued: 'None',
  subtext: 'CUS-1012 · B2B · Wholesale trader · Mr. Sundar\nGSTIN 33AABCN1234F1Z5 · 44 Industrial Estate, Ooty, 643005 · Updated 5 Oct 2026',
};

export const GST_BUSINESS_DATA: GstBusinessItem[] = [
  DEFAULT_GST_BUSINESS,
  {
    id: 'CUS-1013',
    legalName: 'Highland Agro Supplies',
    businessType: 'Supplier',
    contactPerson: 'Ms. Rani',
    phone: '9842109876',
    email: '',
    status: 'Incomplete',
    gstin: '',
    gstAddress: '',
    billingAddressLine1: '',
    city: 'Coonoor',
    state: 'Tamil Nadu',
    pinCode: '643101',
    country: 'India',
    updatedDate: '24 Sep 2026',
    lastUpdatedFull: '24 Sep 2026, 15:30',
    missingInfo: 'GSTIN, Billing Address',
    invoicesIssued: 'None',
    subtext: 'CUS-1013 · B2B · Supplier · Ms. Rani\nGSTIN Missing · No billing address recorded · Updated 24 Sep 2026',
  },
  {
    id: 'CUS-1015',
    legalName: 'Hotel Blue Hills Pvt Ltd',
    businessType: 'Hotel',
    contactPerson: 'Chef Arjun',
    phone: '9789012345',
    email: '',
    status: 'Recorded',
    gstin: '33AABCH5678K1Z2',
    gstAddress: '1 Lake Road, Ooty',
    billingAddressLine1: '1 Lake Road',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643001',
    country: 'India',
    updatedDate: '8 Oct 2026',
    lastUpdatedFull: '8 Oct 2026, 11:20',
    missingInfo: 'None',
    invoicesIssued: 'None',
    subtext: 'CUS-1015 · HORECA · Hotel · Chef Arjun\nGSTIN 33AABCH5678K1Z2 · 1 Lake Road, Ooty, 643001 · Updated 8 Oct 2026',
  },
  {
    id: 'CUS-1018',
    legalName: 'Nilgiri Tea & Produce Co',
    businessType: 'Distributor',
    contactPerson: 'Mr. Ramesh',
    phone: '9443210987',
    email: '',
    status: 'Recorded',
    gstin: '33AAACN9876D1Z4',
    gstAddress: '12 Commercial Rd, Ooty',
    billingAddressLine1: '12 Commercial Rd',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643001',
    country: 'India',
    updatedDate: '2 Oct 2026',
    subtext: 'CUS-1018 · B2B · Distributor · Mr. Ramesh\nGSTIN 33AAACN9876D1Z4 · 12 Commercial Rd, Ooty, 643001 · Updated 2 Oct 2026',
  },
  {
    id: 'CUS-1020',
    legalName: 'Western Ghats Cafe',
    businessType: 'Cafe',
    contactPerson: 'Ms. Priya',
    phone: '9843211223',
    email: '',
    status: 'Incomplete',
    gstin: '',
    gstAddress: '',
    billingAddressLine1: '',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643001',
    country: 'India',
    updatedDate: '1 Oct 2026',
    subtext: 'CUS-1020 · HORECA · Cafe · Ms. Priya\nGSTIN Missing · Billing address pending · Updated 1 Oct 2026',
  },
  {
    id: 'CUS-1022',
    legalName: 'Green Valley Resorts',
    businessType: 'Resort',
    contactPerson: 'Mr. David',
    phone: '9442119988',
    email: '',
    status: 'Recorded',
    gstin: '33AABCG1122F1Z9',
    gstAddress: 'Elk Hill, Ooty',
    billingAddressLine1: 'Elk Hill',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643001',
    country: 'India',
    updatedDate: '28 Sep 2026',
    subtext: 'CUS-1022 · HORECA · Resort · Mr. David\nGSTIN 33AABCG1122F1Z9 · Elk Hill, Ooty, 643001 · Updated 28 Sep 2026',
  },
  {
    id: 'CUS-1025',
    legalName: 'Hill Top Organics',
    businessType: 'Retailer',
    contactPerson: 'Mr. Karthik',
    phone: '9443218877',
    email: '',
    status: 'Recorded',
    gstin: '33AABCH3344J1Z8',
    gstAddress: 'Coonoor Rd, Ooty',
    billingAddressLine1: 'Coonoor Rd',
    city: 'Ooty',
    state: 'Tamil Nadu',
    pinCode: '643002',
    country: 'India',
    updatedDate: '25 Sep 2026',
    subtext: 'CUS-1025 · B2B · Retailer · Mr. Karthik\nGSTIN 33AABCH3344J1Z8 · Coonoor Rd, Ooty, 643002 · Updated 25 Sep 2026',
  },
];

// ─── Screen 1: Customers Management Screen ───────────────────────────────────

export function CustomersManagementScreen({
  onBack,
  onOpenDirectory,
  onOpenGstBusiness,
  onSelectCustomer,
}: {
  onBack: () => void;
  onOpenDirectory: () => void;
  onOpenGstBusiness: () => void;
  onSelectCustomer?: (customer: { id: string; name: string }) => void;
}) {
  const [search, setSearch] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('This week');

  const metrics: Array<{
    value: string;
    label: string;
    icon: 'users' | 'clipboard' | 'box' | 'orders' | 'alert';
    tone?: 'default' | 'warning' | 'danger';
  }> = [
    { value: '18', label: 'Total Customers', icon: 'users' },
    { value: '2', label: 'New Registrations', icon: 'clipboard' },
    { value: '11', label: 'Individual', icon: 'users' },
    { value: '7', label: 'Business (B2B/HORECA)', icon: 'box' },
    { value: '24', label: 'Recent Orders', icon: 'orders' },
    { value: '2', label: 'Business Details Pending', icon: 'alert', tone: 'warning' },
  ];

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="custMgmtGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#custMgmtGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={customerStyles.headerBackBtn}
              accessibilityRole="button"
              accessibilityLabel="Back to More menu"
            >
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <CustomersManagementHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={customerStyles.headerTitle}>Customer Management</Text>
          </View>
          <CircularFilterButton onPress={() => setShowPeriodModal(true)} />
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={customerStyles.searchBox}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={customerStyles.searchInput}
            placeholder="Search ID, name, mobile, GSTIN"
            placeholderTextColor={adminColors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* 6 Metric Cards Grid */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.sm }}>
          {metrics.map((m, idx) => (
            <OverviewDashboardCard
              key={idx}
              title={m.label}
              value={m.value}
              icon={m.icon}
              tone={m.tone ?? 'default'}
              titlePosition="bottom"
            />
          ))}
        </OverviewCardsGrid>

        {/* Helper Note */}
        <Text style={customerStyles.helperNote}>
          New registrations, recent orders and the chart follow the period. Total customers and type counts are current totals, not period-based.
        </Text>

        {/* New registrations this period */}
        <Text style={customerStyles.sectionHeading}>New registrations this period</Text>
        <View style={customerStyles.chartCard}>
          <View style={customerStyles.progressRow}>
            <Text style={customerStyles.progressLabel}>Week of 7</Text>
            <View style={customerStyles.progressTrack}>
              <View style={[customerStyles.progressFill, { width: '40%' }]} />
            </View>
            <Text style={customerStyles.progressValue}>1</Text>
          </View>

          <View style={[customerStyles.progressRow, { marginTop: 12 }]}>
            <Text style={customerStyles.progressLabel}>Week of 14</Text>
            <View style={customerStyles.progressTrack}>
              <View style={[customerStyles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={customerStyles.progressValue}>1</Text>
          </View>
        </View>

        {/* Recent customers */}
        <Text style={customerStyles.sectionHeading}>Recent customers</Text>
        <TouchableOpacity
          style={customerStyles.recentCustomerCard}
          activeOpacity={0.75}
          onPress={() => onSelectCustomer?.({ id: 'CUS-1011', name: 'Lakshmi Narayan' })}
          accessibilityRole="button"
          accessibilityLabel="Customer CUS-1011 Lakshmi Narayan"
        >
          <View style={customerStyles.cardTopRow}>
            <Text style={customerStyles.customerCardTitle}>CUS-1011 · Lakshmi Narayan</Text>
            <View style={customerStyles.badgePending}>
              <Text style={customerStyles.badgePendingText}>Pending activation</Text>
            </View>
          </View>
          <Text style={customerStyles.customerCardSubtext}>
            Individual · +91 ••••• 0164 · Reg. 13 Oct 2026 · No preferred warehouse · No orders yet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={customerStyles.recentCustomerCard}
          activeOpacity={0.75}
          onPress={() => onSelectCustomer?.({ id: 'CUS-1007', name: 'Priya Nair' })}
          accessibilityRole="button"
          accessibilityLabel="Customer CUS-1007 Priya Nair"
        >
          <View style={customerStyles.cardTopRow}>
            <Text style={customerStyles.customerCardTitle}>CUS-1007 · Priya Nair</Text>
            <View style={customerStyles.badgeActive}>
              <Text style={customerStyles.badgeActiveText}>Active</Text>
            </View>
          </View>
          <Text style={customerStyles.customerCardSubtext}>
            Individual · +91 ••••• 0157 · Reg. 12 Oct 2026 · No preferred warehouse · No orders yet
          </Text>
        </TouchableOpacity>

        {/* Quick actions */}
        <Text style={customerStyles.sectionHeading}>Quick actions</Text>
        <View style={customerStyles.quickActionsRow}>
          <TouchableOpacity
            style={customerStyles.quickActionCard}
            onPress={onOpenDirectory}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open Customer Directory"
          >
            <CustomerDirectoryActionIcon size={26} color={adminColors.brand} />
            <Text style={customerStyles.quickActionText}>Customer Directory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={customerStyles.quickActionCard}
            onPress={onOpenGstBusiness}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open GST and Business Accounts"
          >
            <GstBuildingActionIcon size={26} color={adminColors.brand} />
            <Text style={customerStyles.quickActionText}>GST & Business</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Period Filter Modal */}
      <Modal
        visible={showPeriodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Select Reporting Period</Text>
            <View style={customerStyles.filterChipsRow}>
              {['Today', 'This week', 'This month', 'Last 30 days', 'All time'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[customerStyles.filterChip, selectedPeriod === p && customerStyles.filterChipActive]}
                  onPress={() => {
                    setSelectedPeriod(p);
                    setShowPeriodModal(false);
                  }}
                >
                  <Text style={[customerStyles.filterChipText, selectedPeriod === p && customerStyles.filterChipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen 2: Customer Directory Screen ──────────────────────────────────────

export function CustomerDirectoryScreen({
  onBack,
  onSelectCustomer,
  onAddNewCustomer,
}: {
  onBack: () => void;
  onSelectCustomer: (customer: CustomerItem) => void;
  onAddNewCustomer: () => void;
}) {
  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Individual' | 'B2B'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Pending activation'>('All');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('All');

  const filtered = CUSTOMERS_DATA.filter((c) => {
    if (filterType !== 'All' && c.type !== filterType) return false;
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (filterWarehouse !== 'All' && c.preferredWarehouse !== filterWarehouse) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
  });

  const handleResetFilters = () => {
    setFilterType('All');
    setFilterStatus('All');
    setFilterWarehouse('All');
    setShowFilterModal(false);
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="custDirGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#custDirGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={customerStyles.headerTitle}>Customer Directory</Text>
          </View>
          <CircularPlusButton onPress={onAddNewCustomer} />
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with filter */}
        <View style={customerStyles.searchBox}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={customerStyles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={adminColors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
            style={(filterType !== 'All' || filterStatus !== 'All' || filterWarehouse !== 'All') ? customerStyles.filterBtnActive : undefined}
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        <Text style={customerStyles.directoryCountText}>{filtered.length} customers</Text>

        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={customerStyles.customerCard}
            onPress={() => onSelectCustomer(item)}
            activeOpacity={0.75}
          >
            <View style={customerStyles.cardTopRow}>
              <Text style={customerStyles.customerCardTitle}>
                {item.id} · {item.name}
              </Text>
              <View style={item.status === 'Active' ? customerStyles.badgeActive : customerStyles.badgePending}>
                <Text style={item.status === 'Active' ? customerStyles.badgeActiveText : customerStyles.badgePendingText}>
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={customerStyles.customerCardMetaLine1}>
              {item.type} · {item.phone} · {item.gstStatus || 'GST Recorded'} · Preferred: {item.preferredWarehouse}
            </Text>

            <Text style={customerStyles.customerCardMetaLine2}>
              {item.ordersVisible !== undefined ? `${item.ordersVisible} orders visible` : 'No orders'}
              {item.lastPurchase ? ` · Last purchase ${item.lastPurchase}` : ''}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Filter Customer Directory</Text>

            {/* Customer Type */}
            <Text style={customerStyles.filterSectionTitle}>Customer Type</Text>
            <View style={customerStyles.filterChipsRow}>
              {(['All', 'Individual', 'B2B'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[customerStyles.filterChip, filterType === t && customerStyles.filterChipActive]}
                  onPress={() => setFilterType(t)}
                >
                  <Text style={[customerStyles.filterChipText, filterType === t && customerStyles.filterChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status */}
            <Text style={customerStyles.filterSectionTitle}>Status</Text>
            <View style={customerStyles.filterChipsRow}>
              {(['All', 'Active', 'Pending activation'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[customerStyles.filterChip, filterStatus === s && customerStyles.filterChipActive]}
                  onPress={() => setFilterStatus(s)}
                >
                  <Text style={[customerStyles.filterChipText, filterStatus === s && customerStyles.filterChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preferred Warehouse */}
            <Text style={customerStyles.filterSectionTitle}>Preferred Warehouse</Text>
            <View style={customerStyles.filterChipsRow}>
              {['All', 'Ooty', 'Coonoor', 'Kotagiri'].map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[customerStyles.filterChip, filterWarehouse === w && customerStyles.filterChipActive]}
                  onPress={() => setFilterWarehouse(w)}
                >
                  <Text style={[customerStyles.filterChipText, filterWarehouse === w && customerStyles.filterChipTextActive]}>
                    {w}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={customerStyles.modalButtonsRow}>
              <TouchableOpacity
                style={customerStyles.modalResetBtn}
                onPress={handleResetFilters}
              >
                <Text style={customerStyles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customerStyles.modalApplyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={customerStyles.modalApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen 3: Add Customer Screen ───────────────────────────────────────────

export function AddCustomerScreen({
  onBack,
  onSaveCustomer,
}: {
  onBack: () => void;
  onSaveCustomer: (customer: CustomerItem) => void;
}) {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState<'Individual' | 'B2B'>('Individual');

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [gstin, setGstin] = useState('');
  const [bizAddressLine1, setBizAddressLine1] = useState('');
  const [bizCity, setBizCity] = useState('');
  const [bizState, setBizState] = useState('');
  const [bizPinCode, setBizPinCode] = useState('');

  const [warehouse, setWarehouse] = useState('None');

  const handleSave = () => {
    if (!customerName.trim()) {
      Alert.alert('Required Field', 'Please enter customer name.');
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert('Required Field', 'Please enter mobile number.');
      return;
    }

    const newId = `CUS-${1026 + Math.floor(Math.random() * 900)}`;
    const newCust: CustomerItem = {
      id: newId,
      name: customerName.trim(),
      type: customerType,
      displayType: customerType === 'B2B' ? 'B2B' : 'online',
      status: 'Active',
      phone: mobileNumber.trim(),
      email: email.trim(),
      gstStatus: customerType === 'B2B' ? (gstin.trim() ? 'GST Recorded' : 'GST Missing') : 'Not applicable',
      preferredWarehouse: warehouse !== 'None' ? warehouse : 'No preferred warehouse',
      ordersVisible: 0,
      registrationDate: 'Reg. today · Added by admin',
      pickupStates: warehouse !== 'None' ? warehouse : 'Ooty-Warehouse',
      address: addressLine1.trim()
        ? `${addressLine1.trim()}, ${city.trim() || 'Ooty'}, ${state.trim() || 'Tamil Nadu'} ${pinCode.trim()}`
        : '44 Industrial Estate, Ooty, Tamil Nadu 643005',
      isB2B: customerType === 'B2B',
    };

    onSaveCustomer(newCust);
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="addCustGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#addCustGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={customerStyles.headerTitle}>Add customer</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <Text style={customerStyles.formSectionTitle}>Personal Information</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            Customer name <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>
            Mobile number <Text style={{ color: adminColors.danger.text }}>*</Text>
          </Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Email</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Customer type</Text>
          <TouchableOpacity
            style={customerStyles.formDropdownButton}
            onPress={() => setCustomerType((prev) => (prev === 'Individual' ? 'B2B' : 'Individual'))}
            activeOpacity={0.7}
          >
            <Text style={customerStyles.formDropdownText}>{customerType}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>
        </View>

        {/* Address */}
        <Text style={customerStyles.formSectionTitle}>Address</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Address line 1</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Address line 2</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>City</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={city}
            onChangeText={setCity}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>State</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={state}
            onChangeText={setState}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Pin code</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={pinCode}
            onChangeText={setPinCode}
            keyboardType="number-pad"
            placeholder=""
          />
        </View>

        {/* Business information */}
        <Text style={customerStyles.formSectionTitle}>Business information</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Business/legal name</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Business type</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={businessType}
            onChangeText={setBusinessType}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>GSTIN (if applicable)</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={gstin}
            onChangeText={setGstin}
            autoCapitalize="characters"
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Business address line 1</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={bizAddressLine1}
            onChangeText={setBizAddressLine1}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>City</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={bizCity}
            onChangeText={setBizCity}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>State</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={bizState}
            onChangeText={setBizState}
            placeholder=""
          />
        </View>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Pin code</Text>
          <TextInput
            style={customerStyles.formInputBoxEditable}
            value={bizPinCode}
            onChangeText={setBizPinCode}
            keyboardType="number-pad"
            placeholder=""
          />
        </View>

        {/* Preferences */}
        <Text style={customerStyles.formSectionTitle}>Preferences</Text>

        <View style={customerStyles.formFieldGroup}>
          <Text style={customerStyles.formLabel}>Preferred warehouse (optional)</Text>
          <TouchableOpacity
            style={customerStyles.formDropdownButton}
            onPress={() => {
              const options = ['None', 'Ooty-Warehouse', 'Coonoor-Warehouse', 'Kotagiri-Warehouse'];
              const curIdx = options.indexOf(warehouse);
              setWarehouse(options[(curIdx + 1) % options.length] || 'None');
            }}
            activeOpacity={0.7}
          >
            <Text style={customerStyles.formDropdownText}>{warehouse}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>
          <Text style={customerStyles.formHelperNote}>Communication preferences are not configured, so they are not collected.</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Action Bar with Save and Cancel */}
      <View style={customerStyles.addCustomerBottomBar}>
        <TouchableOpacity
          style={customerStyles.addCustomerSaveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={customerStyles.addCustomerSaveText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={customerStyles.addCustomerCancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={customerStyles.addCustomerCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen 4: GST & Business Screen ─────────────────────────────────────────

export function GstBusinessScreen({
  onBack,
  onSelectBusiness,
}: {
  onBack: () => void;
  onSelectBusiness: (biz: GstBusinessItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Recorded' | 'Incomplete'>('All');
  const [filterBusinessType, setFilterBusinessType] = useState<string>('All');
  const [filterGstinStatus, setFilterGstinStatus] = useState<'All' | 'Has GSTIN' | 'Missing GSTIN'>('All');

  const filtered = GST_BUSINESS_DATA.filter((b) => {
    if (filterStatus !== 'All' && b.status !== filterStatus) return false;
    if (filterBusinessType !== 'All' && b.businessType !== filterBusinessType) return false;
    if (filterGstinStatus === 'Has GSTIN' && !b.gstin) return false;
    if (filterGstinStatus === 'Missing GSTIN' && b.gstin) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.legalName.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.gstin.toLowerCase().includes(q);
  });

  const handleResetFilters = () => {
    setFilterStatus('All');
    setFilterBusinessType('All');
    setFilterGstinStatus('All');
    setShowFilterModal(false);
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="gstBizGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#gstBizGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={customerStyles.headerTitle}>GST & Business</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with filter */}
        <View style={customerStyles.searchBox}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={customerStyles.searchInput}
            placeholder="Search businesses..."
            placeholderTextColor={adminColors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
            style={(filterStatus !== 'All' || filterBusinessType !== 'All' || filterGstinStatus !== 'All') ? customerStyles.filterBtnActive : undefined}
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        <Text style={customerStyles.directoryCountText}>7 business customers · 2 incomplete</Text>

        {filtered.map((item) => {
          const isIncomplete = item.status === 'Incomplete';
          return (
            <TouchableOpacity
              key={item.id}
              style={[customerStyles.customerCard, isIncomplete && customerStyles.customerCardIncomplete]}
              onPress={() => onSelectBusiness(item)}
              activeOpacity={0.75}
            >
              <View style={customerStyles.cardTopRow}>
                <Text style={customerStyles.customerCardTitle}>{item.legalName}</Text>
                <View style={isIncomplete ? customerStyles.badgeIncomplete : customerStyles.badgeRecorded}>
                  <Text style={isIncomplete ? customerStyles.badgeIncompleteText : customerStyles.badgeRecordedText}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={customerStyles.customerCardMetaLine1}>
                {item.id} · B2B · {item.businessType} · {item.contactPerson}
              </Text>

              <Text style={customerStyles.customerCardMetaLine2}>
                {item.gstin ? `GSTIN ${item.gstin}` : 'GSTIN Missing'}
                {item.billingAddressLine1 ? ` · ${item.billingAddressLine1}` : ' · No billing address recorded'}
                {` · Updated ${item.updatedDate}`}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Suitable Filter Popup Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Filter GST & Business</Text>

            {/* GST Status */}
            <Text style={customerStyles.filterSectionTitle}>GST Status</Text>
            <View style={customerStyles.filterChipsRow}>
              {(['All', 'Recorded', 'Incomplete'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[customerStyles.filterChip, filterStatus === s && customerStyles.filterChipActive]}
                  onPress={() => setFilterStatus(s)}
                >
                  <Text style={[customerStyles.filterChipText, filterStatus === s && customerStyles.filterChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Business Type */}
            <Text style={customerStyles.filterSectionTitle}>Business Type</Text>
            <View style={customerStyles.filterChipsRow}>
              {['All', 'Wholesale trader', 'Hotel', 'Distributor', 'Cafe', 'Resort', 'Retailer'].map((bt) => (
                <TouchableOpacity
                  key={bt}
                  style={[customerStyles.filterChip, filterBusinessType === bt && customerStyles.filterChipActive]}
                  onPress={() => setFilterBusinessType(bt)}
                >
                  <Text style={[customerStyles.filterChipText, filterBusinessType === bt && customerStyles.filterChipTextActive]}>
                    {bt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* GSTIN Details */}
            <Text style={customerStyles.filterSectionTitle}>GSTIN Recorded</Text>
            <View style={customerStyles.filterChipsRow}>
              {(['All', 'Has GSTIN', 'Missing GSTIN'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[customerStyles.filterChip, filterGstinStatus === g && customerStyles.filterChipActive]}
                  onPress={() => setFilterGstinStatus(g)}
                >
                  <Text style={[customerStyles.filterChipText, filterGstinStatus === g && customerStyles.filterChipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={customerStyles.modalButtonsRow}>
              <TouchableOpacity
                style={customerStyles.modalResetBtn}
                onPress={handleResetFilters}
              >
                <Text style={customerStyles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customerStyles.modalApplyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={customerStyles.modalApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen 5: GST Business Detail Screen ───────────────────────────────────

export function GstBusinessDetailScreen({
  business,
  onBack,
}: {
  business: GstBusinessItem | null;
  onBack: () => void;
}) {
  const item = business ?? DEFAULT_GST_BUSINESS;

  const [legalName, setLegalName] = useState(item.legalName);
  const [businessType, setBusinessType] = useState(item.businessType);
  const [contactPerson, setContactPerson] = useState(item.contactPerson);
  const [phone, setPhone] = useState(item.phone);
  const [email, setEmail] = useState(item.email || '');
  const [gstin, setGstin] = useState(item.gstin || '');
  const [gstAddress, setGstAddress] = useState(item.gstAddress || '44 Industrial Estate, Ooty');
  const [billingAddressLine1, setBillingAddressLine1] = useState(item.billingAddressLine1 || '44 Industrial Estate');
  const [billingAddressLine2] = useState(item.billingAddressLine2 || '');
  const [city, setCity] = useState(item.city || 'Ooty');
  const [state, setState] = useState(item.state || 'Tamil Nadu');
  const [pinCode, setPinCode] = useState(item.pinCode || '643005');
  const [country] = useState(item.country || 'India');
  const [status, setStatus] = useState(item.status);
  const [missingInfo, setMissingInfo] = useState(item.missingInfo || (item.status === 'Incomplete' ? 'GSTIN, Billing Address' : 'None'));
  const [lastUpdatedFull, setLastUpdatedFull] = useState(item.lastUpdatedFull || '5 Oct 2026, 10:00');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editLegalName, setEditLegalName] = useState(legalName);
  const [editBusinessType, setEditBusinessType] = useState(businessType);
  const [editContactPerson, setEditContactPerson] = useState(contactPerson);
  const [editPhone, setEditPhone] = useState(phone);
  const [editEmail, setEditEmail] = useState(email);
  const [editGstin, setEditGstin] = useState(gstin);
  const [editGstAddress, setEditGstAddress] = useState(gstAddress);
  const [editBillingAddress, setEditBillingAddress] = useState(billingAddressLine1);
  const [editCity, setEditCity] = useState(city);
  const [editState, setEditState] = useState(state);
  const [editPinCode, setEditPinCode] = useState(pinCode);
  const [editStatus, setEditStatus] = useState(status);

  const handleOpenEdit = () => {
    setEditLegalName(legalName);
    setEditBusinessType(businessType);
    setEditContactPerson(contactPerson);
    setEditPhone(phone);
    setEditEmail(email);
    setEditGstin(gstin);
    setEditGstAddress(gstAddress);
    setEditBillingAddress(billingAddressLine1);
    setEditCity(city);
    setEditState(state);
    setEditPinCode(pinCode);
    setEditStatus(status);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editLegalName.trim()) {
      Alert.alert('Required', 'Legal/business name is required.');
      return;
    }
    setLegalName(editLegalName.trim());
    setBusinessType(editBusinessType);
    setContactPerson(editContactPerson.trim());
    setPhone(editPhone.trim());
    setEmail(editEmail.trim());
    setGstin(editGstin.trim());
    setGstAddress(editGstAddress.trim());
    setBillingAddressLine1(editBillingAddress.trim());
    setCity(editCity.trim());
    setState(editState.trim());
    setPinCode(editPinCode.trim());
    setStatus(editStatus);

    if (editStatus === 'Incomplete' || !editGstin.trim() || !editBillingAddress.trim()) {
      setMissingInfo(editGstin.trim() ? 'Billing Address' : 'GSTIN, Billing Address');
    } else {
      setMissingInfo('None');
    }
    setLastUpdatedFull('Just now');
    setShowEditModal(false);
    Alert.alert('Updated', 'GST & Business details updated successfully.');
  };

  return (
    <View style={customerStyles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={customerStyles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="gstBizDetailGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#gstBizDetailGrad)" />
        </Svg>

        <View style={customerStyles.headerTopRow}>
          <View style={customerStyles.headerTitleWithIconRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={customerStyles.headerTitle}>GST & Business</Text>
          </View>
          <CircularEditButton onPress={handleOpenEdit} />
        </View>
      </View>

      <ScrollView
        style={customerStyles.scrollContainer}
        contentContainerStyle={customerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Business Information Card */}
        <Text style={customerStyles.formSectionTitle}>Business Information</Text>
        <View style={customerStyles.detailsCard}>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Customer ID</Text>
            <Text style={customerStyles.detailValue}>{item.id}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Legal Name</Text>
            <Text style={customerStyles.detailValue}>{legalName}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Business Type</Text>
            <Text style={customerStyles.detailValue}>{businessType}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Contact Person</Text>
            <Text style={customerStyles.detailValue}>{contactPerson}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Phone</Text>
            <Text style={customerStyles.detailValue}>{phone}</Text>
          </View>
          {email ? (
            <View style={customerStyles.detailRow}>
              <Text style={customerStyles.detailLabel}>Email</Text>
              <Text style={customerStyles.detailValue}>{email}</Text>
            </View>
          ) : null}
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>GST Status</Text>
            <View style={status === 'Recorded' ? customerStyles.badgeRecorded : customerStyles.badgeIncomplete}>
              <Text style={status === 'Recorded' ? customerStyles.badgeRecordedText : customerStyles.badgeIncompleteText}>
                {status}
              </Text>
            </View>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Missing Info</Text>
            <Text style={[customerStyles.detailValue, missingInfo !== 'None' && { color: adminColors.danger.text }]}>
              {missingInfo}
            </Text>
          </View>
        </View>

        {/* GSTIN & Tax Details */}
        <Text style={customerStyles.formSectionTitle}>GSTIN & Tax Details</Text>
        <View style={customerStyles.detailsCard}>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>GSTIN</Text>
            <Text style={customerStyles.detailValue}>{gstin || 'Not Recorded'}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>GST Address</Text>
            <Text style={customerStyles.detailValue}>{gstAddress || 'None'}</Text>
          </View>
        </View>

        {/* Billing Address Card */}
        <Text style={customerStyles.formSectionTitle}>Billing Address</Text>
        <View style={customerStyles.detailsCard}>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Address Line 1</Text>
            <Text style={customerStyles.detailValue}>{billingAddressLine1 || 'None'}</Text>
          </View>
          {billingAddressLine2 ? (
            <View style={customerStyles.detailRow}>
              <Text style={customerStyles.detailLabel}>Address Line 2</Text>
              <Text style={customerStyles.detailValue}>{billingAddressLine2}</Text>
            </View>
          ) : null}
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>City</Text>
            <Text style={customerStyles.detailValue}>{city}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>State</Text>
            <Text style={customerStyles.detailValue}>{state}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>PIN Code</Text>
            <Text style={customerStyles.detailValue}>{pinCode}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Country</Text>
            <Text style={customerStyles.detailValue}>{country}</Text>
          </View>
        </View>

        {/* Verification Summary */}
        <Text style={customerStyles.formSectionTitle}>Verification Summary</Text>
        <View style={customerStyles.detailsCard}>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Last Updated</Text>
            <Text style={customerStyles.detailValue}>{lastUpdatedFull}</Text>
          </View>
          <View style={customerStyles.detailRow}>
            <Text style={customerStyles.detailLabel}>Invoices Issued</Text>
            <Text style={customerStyles.detailValue}>{item.invoicesIssued || 'None'}</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={customerStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <TouchableOpacity
            style={customerStyles.modalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={customerStyles.modalTitle}>Edit Business & GST Details</Text>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={customerStyles.modalLabel}>Legal / Business Name *</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editLegalName}
                onChangeText={setEditLegalName}
              />

              <Text style={customerStyles.modalLabel}>Business Type</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editBusinessType}
                onChangeText={setEditBusinessType}
              />

              <Text style={customerStyles.modalLabel}>Contact Person</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editContactPerson}
                onChangeText={setEditContactPerson}
              />

              <Text style={customerStyles.modalLabel}>Phone</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <Text style={customerStyles.modalLabel}>GSTIN</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editGstin}
                onChangeText={setEditGstin}
                autoCapitalize="characters"
              />

              <Text style={customerStyles.modalLabel}>Billing Address</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editBillingAddress}
                onChangeText={setEditBillingAddress}
              />

              <Text style={customerStyles.modalLabel}>City</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editCity}
                onChangeText={setEditCity}
              />

              <Text style={customerStyles.modalLabel}>State</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editState}
                onChangeText={setEditState}
              />

              <Text style={customerStyles.modalLabel}>PIN Code</Text>
              <TextInput
                style={customerStyles.modalInput}
                value={editPinCode}
                onChangeText={setEditPinCode}
                keyboardType="number-pad"
              />

              <Text style={customerStyles.modalLabel}>Status</Text>
              <View style={customerStyles.filterChipsRow}>
                {(['Recorded', 'Incomplete'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[customerStyles.filterChip, editStatus === st && customerStyles.filterChipActive]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text style={[customerStyles.filterChipText, editStatus === st && customerStyles.filterChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={customerStyles.modalButtonsRow}>
              <TouchableOpacity
                style={customerStyles.modalResetBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={customerStyles.modalResetBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customerStyles.modalApplyBtn}
                onPress={handleSaveEdit}
              >
                <Text style={customerStyles.modalApplyBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Customer Module Stylesheet ───────────────────────────────────────────────

export const customerStyles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: 16,
    backgroundColor: adminColors.brand,
  },
  headerBannerDetails: {
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: 16,
    backgroundColor: adminColors.brand,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitleWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBackBtn: {
    paddingRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.onBrand,
    opacity: 0.88,
    marginTop: 4,
    marginLeft: 34,
  },
  circularHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtnActive: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 8,
    padding: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: adminColors.ink,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 4,
  },
  helperNote: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 14,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 20,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    width: 75,
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: adminColors.brand,
    borderRadius: 5,
  },
  progressValue: {
    width: 20,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  recentCustomerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  customerCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  badgeRecorded: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeRecordedText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  badgeIncomplete: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeIncompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  customerCardSubtext: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 6,
    lineHeight: 17,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 8,
    textAlign: 'center',
  },
  directoryCountText: {
    fontSize: 12.5,
    color: adminColors.muted,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 2,
  },
  customerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
  },
  customerCardIncomplete: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  customerCardMetaLine1: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 6,
  },
  customerCardMetaLine2: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 3,
  },
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  detailLabel: {
    fontSize: 13,
    color: adminColors.muted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '700',
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 16,
    marginBottom: 8,
  },
  formFieldGroup: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  formInputBoxEditable: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  formDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
  },
  formDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  formHelperNote: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  addCustomerBottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  addCustomerSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomerSaveText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  addCustomerCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomerCancelText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '92%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    color: adminColors.ink,
    marginBottom: 6,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalResetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalApplyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});

// ─── Main Customer Management Flow Component ─────────────────────────────────

export interface CustomerManagementFlowProps {
  can?: Can | undefined;
  user?: any;
  onBack: () => void;
}

export function CustomerManagementFlow({
  can,
  user,
  onBack,
}: CustomerManagementFlowProps): React.JSX.Element {
  const [customerScreen, setCustomerScreen] = useState<
    'management' | 'directory' | 'customer_detail' | 'add_customer' | 'gst_business' | 'gst_business_detail'
  >('management');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [selectedGstBusiness, setSelectedGstBusiness] = useState<GstBusinessItem | null>(null);

  const checkCan = (permission: any) => {
    if (!can) return true;
    return can(permission);
  };

  // Hardware back button support for Android
  useEffect(() => {
    const handleHardwareBack = () => {
      if (customerScreen === 'directory' || customerScreen === 'gst_business') {
        setCustomerScreen('management');
        return true;
      }
      if (customerScreen === 'add_customer' || customerScreen === 'customer_detail') {
        setCustomerScreen('directory');
        return true;
      }
      if (customerScreen === 'gst_business_detail') {
        setCustomerScreen('gst_business');
        return true;
      }
      if (customerScreen === 'management') {
        onBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [customerScreen, onBack]);

  if (customerScreen === 'directory') {
    return (
      <CustomerDirectoryScreen
        onBack={() => setCustomerScreen('management')}
        onAddNewCustomer={() => setCustomerScreen('add_customer')}
        onSelectCustomer={(cust) => {
          setSelectedCustomer(cust);
          setCustomerScreen('customer_detail');
        }}
      />
    );
  }

  if (customerScreen === 'add_customer') {
    return (
      <AddCustomerScreen
        onBack={() => setCustomerScreen('directory')}
        onSaveCustomer={(newCust) => {
          CUSTOMERS_DATA.unshift(newCust);
          setCustomerScreen('directory');
        }}
      />
    );
  }

  if (customerScreen === 'customer_detail') {
    return (
      <CustomersFlow
        scope={{ warehouseId: undefined, warehouseName: 'All Warehouses' }}
        warehouseOptions={CUSTOMER_WAREHOUSES}
        can={checkCan}
        initialScreen="CustomerDetails"
        initialParams={{
          customer: selectedCustomer
            ? { name: selectedCustomer.name, id: selectedCustomer.id, code: selectedCustomer.id }
            : undefined,
        }}
        hideQuickActions={false}
        onBack={() => setCustomerScreen('directory')}
      />
    );
  }

  if (customerScreen === 'gst_business') {
    return (
      <GstBusinessScreen
        onBack={() => setCustomerScreen('management')}
        onSelectBusiness={(biz) => {
          setSelectedGstBusiness(biz);
          setCustomerScreen('gst_business_detail');
        }}
      />
    );
  }

  if (customerScreen === 'gst_business_detail') {
    return (
      <GstBusinessDetailScreen
        business={selectedGstBusiness}
        onBack={() => setCustomerScreen('gst_business')}
      />
    );
  }

  return (
    <CustomersManagementScreen
      onBack={onBack}
      onOpenDirectory={() => {
        if (checkCan('customer.list.view') || checkCan('customer.detail.view') || !user) {
          setCustomerScreen('directory');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission to access Customer Directory (customer.list.view).'
          );
        }
      }}
      onSelectCustomer={(cust) => {
        if (checkCan('customer.detail.view') || !user) {
          setSelectedCustomer({
            id: cust.id,
            name: cust.name,
            type: 'Individual',
            phone: '+91 ••••• 0164',
            email: 'customer@example.com',
            status: 'Active',
            preferredWarehouse: 'WH-COON',
            registrationDate: '13 Oct 2026',
          });
          setCustomerScreen('customer_detail');
        } else {
          Alert.alert(
            'Access Restricted',
            'Your role lacks permission to view customer details (customer.detail.view).'
          );
        }
      }}
      onOpenGstBusiness={() => setCustomerScreen('gst_business')}
    />
  );
}

