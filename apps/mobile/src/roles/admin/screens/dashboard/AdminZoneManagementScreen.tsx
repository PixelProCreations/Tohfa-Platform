/**
 * Admin Zone Management Screen Flow
 * Super Admin > More > Zone Management
 * Complete implementation of Module 18 (proposed):
 *   - ZM-01: Zone Dashboard (Overview cards, distribution charts, attention callouts)
 *   - ZM-02: Zone List (Search, filter dropdowns, 5 zone cards with 3-dot menus)
 *   - ZM-03: Zone Details (Zone manager, tabs, 4 KPI cards, details list, map/assign actions)
 *   - ZM-04: Add / Edit New Zone (Zone name, code generator, district, status, draft save)
 * Uses Admin Theme tokens strictly: adminColors, adminRadius, adminSpacing, adminType, adminShadow.
 * Uses OverviewDashboardCard & OverviewCardsGrid for KPI cards.
 */
import React, { useState } from 'react';
import type { DimensionValue } from 'react-native';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AdminZoneManagementScreenProps {
  onBack: () => void;
  onSelectZone?: (zoneId: string) => void;
}

export type ZoneScreenView =
  | 'dashboard'
  | 'list'
  | 'details'
  | 'add_zone'
  | 'edit_zone'
  | 'location_management'
  | 'add_location'
  | 'zone_map'
  | 'farmer_list'
  | 'assign_farmers'
  | 'bulk_assign'
  | 'assigned_farmers'
  | 'farmer_transfer'
  | 'warehouse_mapping'
  | 'zone_reports'
  | 'zone_status_deactivation';

export interface AssignmentSummaryRecord {
  source: 'Assign Farmers' | 'Bulk Farmer Assignment';
  zoneId: string;
  zoneLabel: string;
  zoneName: string;
  locationName: string;
  locationType: string;
  assignedFarmers: ZoneFarmerData[];
  skippedCount: number;
}

export interface LocationData {
  id: string;
  code: string;
  name: string;
  type: 'Town' | 'Village' | 'Locality';
  zoneId: string;
  zoneName: string;
  district: string;
  taluk: string;
  pinCode: string;
  farmersCount: number;
  status: 'Active' | 'Inactive';
  latitude?: string | undefined;
  longitude?: string | undefined;
  notes?: string | undefined;
}

export interface ZoneFarmerData {
  id: string;
  name: string;
  code: string;
  location: string;
  zoneId: string;
  phone: string;
  farmingType: 'Organic' | 'Natural' | 'Biodynamic' | 'Conventional';
  acres: number;
  status: 'Active' | 'Inactive';
  verification: 'Verified' | 'Pending';
}

export interface ZoneWarehouseMappingData {
  id: string;
  code: string;
  name: string;
  type: string;
  sinceDate: string;
  status: 'Active' | 'Inactive';
  isMapped: boolean;
}

export const INITIAL_ZONE_FARMERS: ZoneFarmerData[] = [
  {
    id: 'fmr-00002',
    name: 'Rajesh Kumar',
    code: 'FMR-00002',
    location: 'Lovedale',
    zoneId: 'zn-001',
    phone: '98XXXXX210',
    farmingType: 'Organic',
    acres: 2.5,
    status: 'Active',
    verification: 'Verified',
  },
  {
    id: 'fmr-00014',
    name: 'Murugan Devi',
    code: 'FMR-00014',
    location: 'Ooty Town',
    zoneId: 'zn-001',
    phone: '97XXXXX884',
    farmingType: 'Natural',
    acres: 1.8,
    status: 'Active',
    verification: 'Pending',
  },
  {
    id: 'fmr-00027',
    name: 'Selvam Raj',
    code: 'FMR-00027',
    location: 'Ketti',
    zoneId: 'zn-001',
    phone: '96XXXXX031',
    farmingType: 'Biodynamic',
    acres: 3.1,
    status: 'Active',
    verification: 'Verified',
  },
];

export interface UnassignedFarmerData {
  id: string;
  name: string;
  code: string;
  registeredLocation: string;
  verification: 'Verified' | 'Pending';
}

export const INITIAL_UNASSIGNED_FARMERS: UnassignedFarmerData[] = [
  { id: 'fmr-00249', name: 'Priya Pillai', code: 'FMR-00249', registeredLocation: 'Masinagudi', verification: 'Verified' },
  { id: 'fmr-00250', name: 'Karthik Nair', code: 'FMR-00250', registeredLocation: 'Masinagudi', verification: 'Pending' },
  { id: 'fmr-00251', name: 'Saraswathi Kumar', code: 'FMR-00251', registeredLocation: 'Naduvattam', verification: 'Verified' },
  { id: 'fmr-00252', name: 'Velu Krishnan', code: 'FMR-00252', registeredLocation: 'Naduvattam', verification: 'Verified' },
  { id: 'fmr-00254', name: 'Mani Devi', code: 'FMR-00254', registeredLocation: 'Sholur', verification: 'Verified' },
  { id: 'fmr-00255', name: 'Geetha Gounder', code: 'FMR-00255', registeredLocation: 'Ooty Town', verification: 'Pending' },
  { id: 'fmr-00256', name: 'Sundar Murthy', code: 'FMR-00256', registeredLocation: 'Coonoor Town', verification: 'Verified' },
  { id: 'fmr-00257', name: 'Valli Raj', code: 'FMR-00257', registeredLocation: 'Kotagiri Town', verification: 'Verified' },
  { id: 'fmr-00258', name: 'Raman Rani', code: 'FMR-00258', registeredLocation: 'Gudalur Town', verification: 'Verified' },
  { id: 'fmr-00259', name: 'Pushpa Pillai', code: 'FMR-00259', registeredLocation: 'Devala', verification: 'Verified' },
  { id: 'fmr-00260', name: 'Murugan Nair', code: 'FMR-00260', registeredLocation: 'Wellington', verification: 'Pending' },
];

export interface BulkFarmerItem {
  id: string;
  name: string;
  code: string;
  district: string;
  registeredLocation: string;
  verification: 'Verified' | 'Pending';
  assignedZoneName?: string;
  disabled?: boolean;
}

export const INITIAL_BULK_EXISTING_FARMERS: BulkFarmerItem[] = [
  { id: 'fmr-00001', name: 'Meenakshi Kumar', code: 'FMR-00001', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00002', name: 'Selvam Krishnan', code: 'FMR-00002', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00003', name: 'Lakshmi Subramani', code: 'FMR-00003', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00004', name: 'Senthil Devi', code: 'FMR-00004', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Pending', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00005', name: 'Kavitha Gounder', code: 'FMR-00005', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00006', name: 'Ravi Murthy', code: 'FMR-00006', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00007', name: 'Anitha Raj', code: 'FMR-00007', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00008', name: 'Palani Rani', code: 'FMR-00008', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00009', name: 'Priya Pillai', code: 'FMR-00009', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Pending', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00025', name: 'Kavitha Gounder', code: 'FMR-00025', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00026', name: 'Ravi Murthy', code: 'FMR-00026', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00027', name: 'Anitha Raj', code: 'FMR-00027', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00028', name: 'Palani Rani', code: 'FMR-00028', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00029', name: 'Priya Pillai', code: 'FMR-00029', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Verified', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00030', name: 'Karthik Nair', code: 'FMR-00030', district: 'Nilgiris', registeredLocation: 'Ooty Town', verification: 'Pending', assignedZoneName: 'Ooty Zone' },
  { id: 'fmr-00051', name: 'Subramani Rao', code: 'FMR-00051', district: 'Nilgiris', registeredLocation: 'Kotagiri Town', verification: 'Verified', assignedZoneName: 'Kotagiri Zone' },
  { id: 'fmr-00077', name: 'Kannan Pillai', code: 'FMR-00077', district: 'Nilgiris', registeredLocation: 'Coonoor Town', verification: 'Pending', disabled: true },
  { id: 'fmr-00103', name: 'Devika Nair', code: 'FMR-00103', district: 'Nilgiris', registeredLocation: 'Gudalur Town', verification: 'Verified', assignedZoneName: 'Gudalur Zone' },
];

export const INITIAL_ZONE_WAREHOUSES: ZoneWarehouseMappingData[] = [
  {
    id: 'wh-main',
    code: 'WH-MAIN',
    name: 'Ooty Main Warehouse',
    type: 'Main warehouse',
    sinceDate: '2026-03-20',
    status: 'Active',
    isMapped: true,
  },
  {
    id: 'wh-sub1',
    code: 'WH-SUB1',
    name: 'Coonoor Sub-Warehouse',
    type: 'Sub warehouse',
    sinceDate: '2026-03-20',
    status: 'Active',
    isMapped: true,
  },
];

export const INITIAL_LOCATIONS: LocationData[] = [
  // Ooty Zone locations (ZM-06 reference)
  {
    id: 'loc-001',
    code: 'LOC-001',
    name: 'Ooty Town',
    type: 'Town',
    zoneId: 'zn-001',
    zoneName: 'Ooty Zone (OOT)',
    district: 'Nilgiris',
    taluk: 'Udhagamandalam',
    pinCode: '643001',
    farmersCount: 20,
    status: 'Active',
    latitude: '11.4102',
    longitude: '76.6950',
  },
  {
    id: 'loc-002',
    code: 'LOC-002',
    name: 'Lovedale',
    type: 'Village',
    zoneId: 'zn-001',
    zoneName: 'Ooty Zone (OOT)',
    district: 'Nilgiris',
    taluk: 'Udhagamandalam',
    pinCode: '643003',
    farmersCount: 12,
    status: 'Active',
    latitude: '11.3850',
    longitude: '76.7120',
  },
  {
    id: 'loc-003',
    code: 'LOC-003',
    name: 'Thalakunda',
    type: 'Locality',
    zoneId: 'zn-001',
    zoneName: 'Ooty Zone (OOT)',
    district: 'Nilgiris',
    taluk: 'Udhagamandalam',
    pinCode: '643006',
    farmersCount: 12,
    status: 'Active',
    latitude: '11.4500',
    longitude: '76.6700',
  },
  {
    id: 'loc-004',
    code: 'LOC-004',
    name: 'Ketti',
    type: 'Village',
    zoneId: 'zn-001',
    zoneName: 'Ooty Zone (OOT)',
    district: 'Nilgiris',
    taluk: 'Udhagamandalam',
    pinCode: '643215',
    farmersCount: 10,
    status: 'Active',
    latitude: '11.3700',
    longitude: '76.7400',
  },
  {
    id: 'loc-005',
    code: 'LOC-005',
    name: 'Fingergrove',
    type: 'Locality',
    zoneId: 'zn-001',
    zoneName: 'Ooty Zone (OOT)',
    district: 'Nilgiris',
    taluk: 'Udhagamandalam',
    pinCode: '643004',
    farmersCount: 7,
    status: 'Active',
    latitude: '11.4200',
    longitude: '76.7050',
  },
  {
    id: 'loc-006',
    code: 'LOC-006',
    name: 'Avalanche',
    type: 'Village',
    zoneId: 'zn-001',
    zoneName: 'Ooty Zone (OOT)',
    district: 'Nilgiris',
    taluk: 'Kundah',
    pinCode: '643004',
    farmersCount: 5,
    status: 'Inactive',
    latitude: '11.3000',
    longitude: '76.5900',
  },
  // Coonoor Zone locations (ZM-05 reference)
  {
    id: 'loc-007',
    code: 'LOC-007',
    name: 'Coonoor Town',
    type: 'Town',
    zoneId: 'zn-002',
    zoneName: 'Coonoor Zone (COO)',
    district: 'Nilgiris',
    taluk: 'Coonoor',
    pinCode: '643101',
    farmersCount: 22,
    status: 'Active',
    latitude: '11.3530',
    longitude: '76.7959',
  },
  {
    id: 'loc-008',
    code: 'LOC-008',
    name: 'Wellington',
    type: 'Town',
    zoneId: 'zn-002',
    zoneName: 'Coonoor Zone (COO)',
    district: 'Nilgiris',
    taluk: 'Coonoor',
    pinCode: '643231',
    farmersCount: 16,
    status: 'Active',
    latitude: '11.3667',
    longitude: '76.7833',
  },
  {
    id: 'loc-009',
    code: 'LOC-009',
    name: 'Aruvankadu',
    type: 'Village',
    zoneId: 'zn-002',
    zoneName: 'Coonoor Zone (COO)',
    district: 'Nilgiris',
    taluk: 'Coonoor',
    pinCode: '643202',
    farmersCount: 12,
    status: 'Active',
    latitude: '11.3750',
    longitude: '76.8100',
  },
  {
    id: 'loc-010',
    code: 'LOC-010',
    name: 'Burliyar',
    type: 'Village',
    zoneId: 'zn-002',
    zoneName: 'Coonoor Zone (COO)',
    district: 'Nilgiris',
    taluk: 'Coonoor',
    pinCode: '643102',
    farmersCount: 8,
    status: 'Active',
    latitude: '11.3300',
    longitude: '76.8400',
  },
  {
    id: 'loc-011',
    code: 'LOC-011',
    name: 'Kattery',
    type: 'Village',
    zoneId: 'zn-002',
    zoneName: 'Coonoor Zone (COO)',
    district: 'Nilgiris',
    taluk: 'Coonoor',
    pinCode: '643213',
    farmersCount: 6,
    status: 'Active',
    latitude: '11.3450',
    longitude: '76.7700',
  },
  // Kotagiri Zone locations
  {
    id: 'loc-012',
    code: 'LOC-012',
    name: 'Kotagiri Town',
    type: 'Town',
    zoneId: 'zn-003',
    zoneName: 'Kotagiri Zone (KOT)',
    district: 'Nilgiris',
    taluk: 'Kotagiri',
    pinCode: '643217',
    farmersCount: 16,
    status: 'Active',
    latitude: '11.4218',
    longitude: '76.8617',
  },
  {
    id: 'loc-013',
    code: 'LOC-013',
    name: 'Aravenu',
    type: 'Village',
    zoneId: 'zn-003',
    zoneName: 'Kotagiri Zone (KOT)',
    district: 'Nilgiris',
    taluk: 'Kotagiri',
    pinCode: '643201',
    farmersCount: 12,
    status: 'Active',
    latitude: '11.4080',
    longitude: '76.8750',
  },
  {
    id: 'loc-014',
    code: 'LOC-014',
    name: 'Denad',
    type: 'Village',
    zoneId: 'zn-003',
    zoneName: 'Kotagiri Zone (KOT)',
    district: 'Nilgiris',
    taluk: 'Kotagiri',
    pinCode: '643217',
    farmersCount: 8,
    status: 'Active',
    latitude: '11.4400',
    longitude: '76.8850',
  },
  {
    id: 'loc-015',
    code: 'LOC-015',
    name: 'Milidhane',
    type: 'Locality',
    zoneId: 'zn-003',
    zoneName: 'Kotagiri Zone (KOT)',
    district: 'Nilgiris',
    taluk: 'Kotagiri',
    pinCode: '643217',
    farmersCount: 5,
    status: 'Active',
    latitude: '11.4150',
    longitude: '76.8450',
  },
  // Gudalur Zone locations
  {
    id: 'loc-016',
    code: 'LOC-016',
    name: 'Gudalur Town',
    type: 'Town',
    zoneId: 'zn-004',
    zoneName: 'Gudalur Zone (GUD)',
    district: 'Nilgiris',
    taluk: 'Gudalur',
    pinCode: '643212',
    farmersCount: 12,
    status: 'Active',
    latitude: '11.5030',
    longitude: '76.4917',
  },
  {
    id: 'loc-017',
    code: 'LOC-017',
    name: 'Devala',
    type: 'Village',
    zoneId: 'zn-004',
    zoneName: 'Gudalur Zone (GUD)',
    district: 'Nilgiris',
    taluk: 'Gudalur',
    pinCode: '643270',
    farmersCount: 7,
    status: 'Active',
    latitude: '11.4710',
    longitude: '76.3820',
  },
  {
    id: 'loc-018',
    code: 'LOC-018',
    name: 'Masinagudi',
    type: 'Village',
    zoneId: 'zn-004',
    zoneName: 'Gudalur Zone (GUD)',
    district: 'Nilgiris',
    taluk: 'Gudalur',
    pinCode: '643223',
    farmersCount: 5,
    status: 'Active',
    latitude: '11.5720',
    longitude: '76.6430',
  },
  {
    id: 'loc-019',
    code: 'LOC-019',
    name: 'Pandalur',
    type: 'Village',
    zoneId: 'zn-004',
    zoneName: 'Gudalur Zone (GUD)',
    district: 'Nilgiris',
    taluk: 'Pandalur',
    pinCode: '643233',
    farmersCount: 3,
    status: 'Active',
    latitude: '11.4870',
    longitude: '76.3380',
  },
  {
    id: 'loc-020',
    code: 'LOC-020',
    name: 'Cherambadi',
    type: 'Locality',
    zoneId: 'zn-004',
    zoneName: 'Gudalur Zone (GUD)',
    district: 'Nilgiris',
    taluk: 'Pandalur',
    pinCode: '643205',
    farmersCount: 2,
    status: 'Active',
    latitude: '11.5200',
    longitude: '76.2800',
  },
];

export interface ZoneData {
  id: string;
  code: string;
  shortCode: string;
  name: string;
  district: string;
  taluk: string;
  locationsCount: number;
  farmersCount: number;
  warehousesCount: number;
  farmAreaAcres: number;
  verifiedFarmers: number;
  activeFarmers: number;
  status: 'Active' | 'Inactive';
  createdDate: string;
  manager: string;
  description: string;
  contact: string;
  boundaryPoints: number;
  warehouses: string[];
}

const INITIAL_ZONES: ZoneData[] = [
  {
    id: 'zn-001',
    code: 'ZN-001',
    shortCode: 'OOT',
    name: 'Ooty Zone',
    district: 'Nilgiris',
    taluk: 'Udhagamandalam',
    locationsCount: 6,
    farmersCount: 92,
    warehousesCount: 2,
    farmAreaAcres: 312.4,
    verifiedFarmers: 78,
    activeFarmers: 89,
    status: 'Active',
    createdDate: '2026-03-10',
    manager: 'Demo Farmer Admin One',
    description: 'Ooty and surrounding farming locations.',
    contact: 'Not set',
    boundaryPoints: 4,
    warehouses: ['Ooty Main', 'Coonoor Sub'],
  },
  {
    id: 'zn-002',
    code: 'ZN-002',
    shortCode: 'COO',
    name: 'Coonoor Zone',
    district: 'Nilgiris',
    taluk: 'Coonoor',
    locationsCount: 5,
    farmersCount: 64,
    warehousesCount: 1,
    farmAreaAcres: 245.0,
    verifiedFarmers: 58,
    activeFarmers: 62,
    status: 'Active',
    createdDate: '2026-03-12',
    manager: 'Demo Farmer Admin Two',
    description: 'Coonoor valley and temperate horticulture belts.',
    contact: 'Not set',
    boundaryPoints: 4,
    warehouses: ['Coonoor Sub'],
  },
  {
    id: 'zn-003',
    code: 'ZN-003',
    shortCode: 'KOT',
    name: 'Kotagiri Zone',
    district: 'Nilgiris',
    taluk: 'Kotagiri',
    locationsCount: 4,
    farmersCount: 41,
    warehousesCount: 1,
    farmAreaAcres: 180.5,
    verifiedFarmers: 38,
    activeFarmers: 40,
    status: 'Active',
    createdDate: '2026-03-15',
    manager: 'Demo Farmer Admin One',
    description: 'Kotagiri slopes, organic crops and tea cultivation.',
    contact: 'Not set',
    boundaryPoints: 4,
    warehouses: ['Kotagiri Sub'],
  },
  {
    id: 'zn-004',
    code: 'ZN-004',
    shortCode: 'GUD',
    name: 'Gudalur Zone',
    district: 'Nilgiris',
    taluk: 'Gudalur',
    locationsCount: 5,
    farmersCount: 29,
    warehousesCount: 1,
    farmAreaAcres: 125.8,
    verifiedFarmers: 24,
    activeFarmers: 28,
    status: 'Active',
    createdDate: '2026-03-20',
    manager: 'Demo Farmer Admin Three',
    description: 'Gudalur foothills, spices and sub-tropical fruit crops.',
    contact: 'Not set',
    boundaryPoints: 4,
    warehouses: ['Gudalur Market Sub'],
  },
  {
    id: 'zn-005',
    code: 'ZN-005',
    shortCode: 'KUN',
    name: 'Kundah Zone',
    district: 'Nilgiris',
    taluk: 'Kundah',
    locationsCount: 4,
    farmersCount: 22,
    warehousesCount: 0,
    farmAreaAcres: 95.0,
    verifiedFarmers: 16,
    activeFarmers: 19,
    status: 'Inactive',
    createdDate: '2026-04-02',
    manager: 'None',
    description: 'Kundah upper reservoir catchment farming belt.',
    contact: 'Not set',
    boundaryPoints: 4,
    warehouses: ['None'],
  },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ThreeDotsIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="19" r="1.8" fill={color} />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 13, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function AdminZoneManagementScreen({
  onBack,
  onSelectZone,
}: AdminZoneManagementScreenProps): React.JSX.Element {
  const [currentView, setCurrentView] = useState<ZoneScreenView>('dashboard');
  const [zones, setZones] = useState<ZoneData[]>(INITIAL_ZONES);
  const [selectedZone, setSelectedZone] = useState<ZoneData>(INITIAL_ZONES[0]!);
  const [detailsSubTab, setDetailsSubTab] = useState<'Overview' | 'Locations' | 'Farmers' | 'Warehouses'>('Overview');

  // Filter States for Zone List
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDistrict, setFilterDistrict] = useState<string>('All');

  // Location Management & Assigned Locations State (ZM-05, ZM-06, ZM-07)
  const [locations, setLocations] = useState<LocationData[]>(INITIAL_LOCATIONS);
  const [selectedLocationZone, setSelectedLocationZone] = useState<string>('Ooty Zone (OOT)');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationFilterType, setLocationFilterType] = useState('All');
  const [locationFilterStatus, setLocationFilterStatus] = useState('All');

  // Add Location Form State (ZM-07)
  const [newLocZone, setNewLocZone] = useState('Ooty Zone (OOT)');
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<'Village' | 'Town' | 'Locality'>('Village');
  const [newLocTaluk, setNewLocTaluk] = useState('Udhagamandalam');
  const [newLocPin, setNewLocPin] = useState('643001');
  const [newLocSearchPlace, setNewLocSearchPlace] = useState('');
  const [newLocLat, setNewLocLat] = useState('11.4102');
  const [newLocLong, setNewLocLong] = useState('76.6950');
  const [pinDropped, setPinDropped] = useState(false);
  const [newLocStatus, setNewLocStatus] = useState<'Active' | 'Inactive'>('Active');
  const [newLocNotes, setNewLocNotes] = useState('');
  const [previousViewBeforeAddLoc, setPreviousViewBeforeAddLoc] = useState<'location_management' | 'edit_zone'>('location_management');

  // ZM-08 Zone Map & Boundary State
  const [_mapSelectedZone, setMapSelectedZone] = useState('Ooty Zone (OOT)');
  const [_mapSearchQuery, _setMapSearchQuery] = useState('');
  const [mapSelectedTool, setMapSelectedTool] = useState<'View' | 'Add pin' | 'Select' | 'Draw boundary' | 'Edit boundary'>('View');
  const [droppedPinCoords, setDroppedPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedMarkersCount, setSelectedMarkersCount] = useState<number>(0);
  const [drawnBoundaryPoints, setDrawnBoundaryPoints] = useState<Array<{ x: number; y: number }>>([]);

  // ZM-09 Zone Farmer List State
  const [farmerSelectedZone, setFarmerSelectedZone] = useState('Ooty Zone (OOT)');
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');
  const [farmerFilterLocation, _setFarmerFilterLocation] = useState('All');
  const [farmerFilterStatus, _setFarmerFilterStatus] = useState('All');
  const [farmerFilterType, _setFarmerFilterType] = useState('All');
  const [farmerFilterVerification, _setFarmerFilterVerification] = useState('All');
  const [farmersList, setFarmersList] = useState<ZoneFarmerData[]>(INITIAL_ZONE_FARMERS);

  // ZM-10 & ZM-11 Assign Farmers State
  const [previousViewBeforeAssign, setPreviousViewBeforeAssign] = useState<ZoneScreenView>('dashboard');
  const [assignStep, setAssignStep] = useState<1 | 2 | 3 | 4>(1);
  const [assignSelectedZoneId, setAssignSelectedZoneId] = useState<string>('zn-001');
  const [assignSelectedLocationId, setAssignSelectedLocationId] = useState<string>('loc-005');
  const [unassignedFarmers, setUnassignedFarmers] = useState<UnassignedFarmerData[]>(INITIAL_UNASSIGNED_FARMERS);
  const [assignFarmerSearch, setAssignFarmerSearch] = useState('');
  const [assignSelectedFarmerIds, setAssignSelectedFarmerIds] = useState<string[]>([]);
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [bulkTargetZoneId, setBulkTargetZoneId] = useState<string>('');
  const [bulkTargetLocationId, setBulkTargetLocationId] = useState<string>('');
  const [bulkShowZonePicker, setBulkShowZonePicker] = useState(false);
  const [bulkShowLocPicker, setBulkShowLocPicker] = useState(false);
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const [bulkDistrictFilter, setBulkDistrictFilter] = useState<'All' | 'Nilgiris'>('All');
  const [bulkRegLocationFilter, setBulkRegLocationFilter] = useState<string>('All');
  const [bulkVerificationFilter, setBulkVerificationFilter] = useState<'All' | 'Verified' | 'Pending'>('All');
  const [bulkOpenFilterDropdown, setBulkOpenFilterDropdown] = useState<'district' | 'location' | 'verification' | null>(null);
  const [bulkSelectedFarmerIds, setBulkSelectedFarmerIds] = useState<string[]>([]);
  const [bulkVisibleLimit, setBulkVisibleLimit] = useState<number>(10);
  const [bulkExistingFarmers, setBulkExistingFarmers] = useState<BulkFarmerItem[]>(INITIAL_BULK_EXISTING_FARMERS);
  const [lastAssignmentResult, setLastAssignmentResult] = useState<AssignmentSummaryRecord | null>(null);

  // ZM-12 Farmer Zone Transfer State
  const [transferSearchFarmer, setTransferSearchFarmer] = useState('');
  const [transferSelectedFarmer, setTransferSelectedFarmer] = useState<ZoneFarmerData>(INITIAL_ZONE_FARMERS[1]!);
  const [transferNewZone, _setTransferNewZone] = useState('Coonoor Zone');
  const [transferNewLocation, _setTransferNewLocation] = useState('Wellington');
  const [transferReason, setTransferReason] = useState('Farm land expanded into Wellington block border.');
  const [recentTransfers, setRecentTransfers] = useState([
    { id: 'TR-0014', text: 'Rajesh Kumar: Gudalur Zone to Ooty Zone — 2026-10-02' },
  ]);

  // ZM-13 Zone Warehouse Mapping State
  const [warehouseSelectedZone, setWarehouseSelectedZone] = useState('Ooty Zone (OOT)');
  const [warehouseMappings, setWarehouseMappings] = useState<ZoneWarehouseMappingData[]>(INITIAL_ZONE_WAREHOUSES);

  // ZM-14 Zone Reports State
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportZone, setReportZone] = useState('All zones');
  const [reportFarmerStatus, setReportFarmerStatus] = useState('All');
  const [reportFarmingType, setReportFarmingType] = useState('All');
  const [showReportZoneDropdown, setShowReportZoneDropdown] = useState(false);
  const [showReportStatusDropdown, setShowReportStatusDropdown] = useState(false);
  const [showReportTypeDropdown, setShowReportTypeDropdown] = useState(false);

  // ZM-15 Zone Status & Deactivation State
  const [deactivationZone, setDeactivationZone] = useState<ZoneData>(INITIAL_ZONES[4]!);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [previousViewBeforeDeactivation, setPreviousViewBeforeDeactivation] = useState<ZoneScreenView>('dashboard');

  // Add / Edit Zone Form State
  const [formZoneName, setFormZoneName] = useState('');
  const [formZoneCode, setFormZoneCode] = useState('');
  const [formDistrict, setFormDistrict] = useState('Nilgiris');
  const [formDescription, setFormDescription] = useState('');
  const [formManager, setFormManager] = useState('None');
  const [formContact, setFormContact] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Navigation handlers
  const handleNavigateToDetails = (zone: ZoneData) => {
    setSelectedZone(zone);
    setCurrentView('details');
    onSelectZone?.(zone.id);
  };

  const handleNavigateToAddZone = () => {
    setIsEditingExisting(false);
    setFormZoneName('');
    setFormZoneCode('');
    setFormDistrict('Nilgiris');
    setFormDescription('');
    setFormManager('None');
    setFormContact('');
    setFormStatus('Active');
    setCurrentView('add_zone');
  };

  const handleNavigateToEditZone = (zone: ZoneData) => {
    setSelectedZone(zone);
    setIsEditingExisting(true);
    setFormZoneName(zone.name);
    setFormZoneCode(zone.shortCode);
    setFormDistrict(zone.district);
    setFormDescription(zone.description);
    setFormManager(zone.manager);
    setFormContact(zone.contact === 'Not set' ? '' : zone.contact);
    setFormStatus(zone.status);
    setCurrentView('edit_zone');
  };

  const handleNavigateToLocationManagement = (zoneName?: string) => {
    if (zoneName) {
      const match = zones.find((z) => z.name === zoneName || z.id === zoneName);
      if (match) {
        setSelectedLocationZone(`${match.name} (${match.shortCode})`);
      }
    }
    setCurrentView('location_management');
  };

  const handleNavigateToAddLocation = (
    zoneName?: string,
    from: 'location_management' | 'edit_zone' = 'location_management'
  ) => {
    setPreviousViewBeforeAddLoc(from);
    if (zoneName) {
      setNewLocZone(zoneName);
    } else {
      setNewLocZone(`${selectedZone.name} (${selectedZone.shortCode})`);
    }
    setNewLocName('');
    setNewLocType('Village');
    setNewLocTaluk('Udhagamandalam');
    setNewLocPin('643001');
    setNewLocSearchPlace('');
    setNewLocLat('11.4102');
    setNewLocLong('76.6950');
    setPinDropped(false);
    setNewLocStatus('Active');
    setNewLocNotes('');
    setCurrentView('add_location');
  };

  const handleNavigateToZoneMap = (zoneName?: string) => {
    if (zoneName) {
      const match = zones.find((z) => z.name === zoneName || z.id === zoneName);
      if (match) {
        setMapSelectedZone(`${match.name} (${match.shortCode})`);
      }
    }
    setCurrentView('zone_map');
  };

  const handleNavigateToFarmerList = (zoneName?: string) => {
    if (zoneName) {
      const match = zones.find((z) => z.name === zoneName || z.id === zoneName);
      if (match) {
        setFarmerSelectedZone(`${match.name} (${match.shortCode})`);
      }
    }
    setCurrentView('farmer_list');
  };

  const handleNavigateToAssignFarmers = (from: ZoneScreenView = 'dashboard') => {
    setPreviousViewBeforeAssign(from);
    setAssignStep(1);
    setAssignFarmerSearch('');
    setAssignSelectedFarmerIds([]);
    setCurrentView('assign_farmers');
  };

  const handleConfirmFarmerAssignment = () => {
    const targetZone = zones.find((z) => z.id === assignSelectedZoneId) ?? zones[0];
    const targetLoc = locations.find((l) => l.id === assignSelectedLocationId) ?? locations[0];
    const chosenFarmers = unassignedFarmers.filter((f) => assignSelectedFarmerIds.includes(f.id));
    if (!targetZone || !targetLoc || chosenFarmers.length === 0) return;

    const newlyAssigned: ZoneFarmerData[] = chosenFarmers.map((f) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      location: targetLoc.name,
      zoneId: targetZone.id,
      phone: '98XXXXX000',
      farmingType: 'Organic',
      acres: 2.0,
      status: 'Active',
      verification: f.verification,
    }));

    setFarmersList((prev) => [...newlyAssigned, ...prev]);
    setUnassignedFarmers((prev) => prev.filter((f) => !assignSelectedFarmerIds.includes(f.id)));
    setBulkExistingFarmers((prev) => [
      ...chosenFarmers.map((f) => ({
        id: f.id,
        name: f.name,
        code: f.code,
        district: 'Nilgiris',
        registeredLocation: f.registeredLocation,
        verification: f.verification,
        assignedZoneName: targetZone.name,
      })),
      ...prev,
    ]);
    setZones((prev) =>
      prev.map((z) =>
        z.id === targetZone.id
          ? {
              ...z,
              farmersCount: z.farmersCount + chosenFarmers.length,
              activeFarmers: z.activeFarmers + chosenFarmers.length,
            }
          : z
      )
    );
    setLocations((prev) =>
      prev.map((l) =>
        l.id === targetLoc.id ? { ...l, farmersCount: l.farmersCount + chosenFarmers.length } : l
      )
    );

    setLastAssignmentResult({
      source: 'Assign Farmers',
      zoneId: targetZone.id,
      zoneLabel: `${targetZone.name} (${targetZone.shortCode})`,
      zoneName: targetZone.name,
      locationName: targetLoc.name,
      locationType: targetLoc.type,
      assignedFarmers: newlyAssigned,
      skippedCount: 0,
    });
    setAssignStep(1);
    setAssignFarmerSearch('');
    setAssignSelectedFarmerIds([]);
    setCurrentView('assigned_farmers');
  };

  const handleNavigateToBulkAssign = () => {
    setBulkStep(1);
    setBulkTargetZoneId('');
    setBulkTargetLocationId('');
    setBulkShowZonePicker(false);
    setBulkShowLocPicker(false);
    setBulkSearchQuery('');
    setBulkDistrictFilter('All');
    setBulkRegLocationFilter('All');
    setBulkVerificationFilter('All');
    setBulkOpenFilterDropdown(null);
    setBulkSelectedFarmerIds([]);
    setBulkVisibleLimit(10);
    setCurrentView('bulk_assign');
  };

  const handleConfirmBulkAssignment = () => {
    const targetZone = zones.find((z) => z.id === bulkTargetZoneId);
    const targetLoc = locations.find((l) => l.id === bulkTargetLocationId);
    if (!targetZone || !targetLoc) return;

    const eligibleChosen = unassignedFarmers.filter((f) => bulkSelectedFarmerIds.includes(f.id));
    const skippedCount = Math.max(0, bulkSelectedFarmerIds.length - eligibleChosen.length);
    const newlyAssigned: ZoneFarmerData[] = eligibleChosen.map((f) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      location: targetLoc.name,
      zoneId: targetZone.id,
      phone: '98XXXXX000',
      farmingType: 'Organic',
      acres: 2.0,
      status: 'Active',
      verification: f.verification,
    }));

    if (eligibleChosen.length > 0) {
      setFarmersList((prev) => [...newlyAssigned, ...prev]);
      setUnassignedFarmers((prev) => prev.filter((f) => !bulkSelectedFarmerIds.includes(f.id)));
      setBulkExistingFarmers((prev) => [
        ...eligibleChosen.map((f) => ({
          id: f.id,
          name: f.name,
          code: f.code,
          district: 'Nilgiris',
          registeredLocation: f.registeredLocation,
          verification: f.verification,
          assignedZoneName: targetZone.name,
        })),
        ...prev,
      ]);
      setZones((prev) =>
        prev.map((z) =>
          z.id === targetZone.id
            ? {
                ...z,
                farmersCount: z.farmersCount + eligibleChosen.length,
                activeFarmers: z.activeFarmers + eligibleChosen.length,
              }
            : z
        )
      );
      setLocations((prev) =>
        prev.map((l) =>
          l.id === targetLoc.id ? { ...l, farmersCount: l.farmersCount + eligibleChosen.length } : l
        )
      );
    }

    setLastAssignmentResult({
      source: 'Bulk Farmer Assignment',
      zoneId: targetZone.id,
      zoneLabel: `${targetZone.name} (${targetZone.shortCode})`,
      zoneName: targetZone.name,
      locationName: targetLoc.name,
      locationType: targetLoc.type,
      assignedFarmers: newlyAssigned,
      skippedCount,
    });
    setBulkStep(1);
    setBulkSelectedFarmerIds([]);
    setCurrentView('assigned_farmers');
  };

  const handleNavigateToFarmerTransfer = (farmer: ZoneFarmerData) => {
    setTransferSelectedFarmer(farmer);
    setCurrentView('farmer_transfer');
  };

  const handleNavigateToWarehouseMapping = (zoneName?: string) => {
    if (zoneName) {
      const match = zones.find((z) => z.name === zoneName || z.id === zoneName);
      if (match) {
        setWarehouseSelectedZone(`${match.name} (${match.shortCode})`);
      }
    }
    setCurrentView('warehouse_mapping');
  };

  const handleNavigateToReports = () => {
    setCurrentView('zone_reports');
  };

  const handleNavigateToZoneStatus = (zone?: ZoneData, from: ZoneScreenView = 'dashboard') => {
    if (zone) {
      setDeactivationZone(zone);
    } else {
      const kundah = zones.find((z) => z.code === 'ZN-005') ?? zones[4] ?? INITIAL_ZONES[0]!;
      setDeactivationZone(kundah);
    }
    setPreviousViewBeforeDeactivation(from);
    setCurrentView('zone_status_deactivation');
  };

  const handleExportReport = () => {
    Alert.alert(
      'Export Report',
      `Zone-wise report generated for ${reportZone} (${reportFarmerStatus} status, ${reportFarmingType} farming type).\nExported as CSV to Downloads.`,
      [{ text: 'OK' }]
    );
  };

  const handleReactivateZone = () => {
    if (deactivationReason.trim().length < 5) {
      Alert.alert(
        'Reason Required',
        'Please enter a valid reason (at least 5 characters) for reactivating this zone. This will be recorded in the activity log.'
      );
      return;
    }
    const updatedZone = { ...deactivationZone, status: 'Active' as const };
    setDeactivationZone(updatedZone);
    setZones((prev) =>
      prev.map((z) => (z.id === updatedZone.id ? updatedZone : z))
    );
    if (selectedZone.id === updatedZone.id) {
      setSelectedZone(updatedZone);
    }
    Alert.alert(
      'Zone Reactivated',
      `${updatedZone.name} is now Active. Farmers can now be assigned normally.`,
      [{ text: 'OK' }]
    );
  };

  const handleArchiveZone = () => {
    if (deactivationReason.trim().length < 5) {
      Alert.alert(
        'Reason Required',
        'Please enter a valid reason (at least 5 characters) before archiving this zone.'
      );
      return;
    }
    if (deactivationZone.farmersCount > 0) {
      Alert.alert(
        'Cannot Archive Zone',
        `${deactivationZone.farmersCount} farmers are kept assigned and frozen in ${deactivationZone.name}. Archiving requires transferring them first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Transfer Farmers',
            onPress: () => {
              handleNavigateToAssignFarmers('zone_status_deactivation');
            },
          },
        ]
      );
      return;
    }
    Alert.alert(
      'Archive Zone',
      `Are you sure you want to archive ${deactivationZone.name}? This will permanently remove it from active operations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            setZones((prev) => prev.filter((z) => z.id !== deactivationZone.id));
            Alert.alert('Zone Archived', `${deactivationZone.name} has been archived.`);
            setCurrentView('list');
          },
        },
      ]
    );
  };

  const handleSaveNewLocation = () => {
    if (!newLocName.trim() || !newLocPin.trim()) {
      Alert.alert('Required Fields', 'Please enter a Location name and PIN code.');
      return;
    }

    const nextId = `loc-${String(locations.length + 1).padStart(3, '0')}`;
    const nextCode = `LOC-${String(locations.length + 1).padStart(3, '0')}`;
    const matchedZone =
      zones.find((z) => newLocZone.includes(z.shortCode) || newLocZone.includes(z.name)) ||
      selectedZone;

    const newLoc: LocationData = {
      id: nextId,
      code: nextCode,
      name: newLocName.trim(),
      type: newLocType,
      zoneId: matchedZone.id,
      zoneName: `${matchedZone.name} (${matchedZone.shortCode})`,
      district: 'Nilgiris',
      taluk: newLocTaluk.trim() || 'Udhagamandalam',
      pinCode: newLocPin.trim(),
      farmersCount: 0,
      status: newLocStatus,
      latitude: pinDropped ? newLocLat : undefined,
      longitude: pinDropped ? newLocLong : undefined,
      notes: newLocNotes.trim() || undefined,
    };

    setLocations((prev) => [newLoc, ...prev]);
    setZones((prev) =>
      prev.map((z) =>
        z.id === matchedZone.id ? { ...z, locationsCount: z.locationsCount + 1 } : z
      )
    );

    Alert.alert('Location Added', `Location "${newLocName}" added to ${matchedZone.name}.`);
    setCurrentView(previousViewBeforeAddLoc);
  };

  const handleRemoveLocation = (locId: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== locId));
    setZones((prev) =>
      prev.map((z) =>
        z.id === selectedZone.id
          ? { ...z, locationsCount: Math.max(0, z.locationsCount - 1) }
          : z
      )
    );
  };

  const handleToggleLocationStatus = (locId: string) => {
    setLocations((prev) =>
      prev.map((l) =>
        l.id === locId
          ? { ...l, status: l.status === 'Active' ? 'Inactive' : 'Active' }
          : l
      )
    );
  };

  const handleSaveZone = (asDraft: boolean = false) => {
    if (!formZoneName.trim() || !formZoneCode.trim()) {
      Alert.alert('Required Fields', 'Please enter a Zone Name and 2-5 letter Zone Code.');
      return;
    }

    const shortCode = formZoneCode.trim().toUpperCase();
    if (isEditingExisting) {
      setZones((prev) =>
        prev.map((z) =>
          z.id === selectedZone.id
            ? {
              ...z,
              name: formZoneName.trim(),
              shortCode,
              district: formDistrict,
              description: formDescription.trim(),
              manager: formManager,
              contact: formContact.trim() || 'Not set',
              status: formStatus,
            }
            : z
        )
      );
      Alert.alert('Success', `Zone ${formZoneName} updated successfully.`);
    } else {
      const nextNum = zones.length + 1;
      const code = `ZN-00${nextNum}`;
      const newZone: ZoneData = {
        id: `zn-00${nextNum}`,
        code,
        shortCode,
        name: formZoneName.trim(),
        district: formDistrict,
        taluk: 'Nilgiris Belt',
        locationsCount: 3,
        farmersCount: 10,
        warehousesCount: 1,
        farmAreaAcres: 45.0,
        verifiedFarmers: 8,
        activeFarmers: 10,
        status: asDraft ? 'Inactive' : formStatus,
        createdDate: '2026-10-15',
        manager: formManager,
        description: formDescription.trim() || 'Newly created sourcing zone.',
        contact: formContact.trim() || 'Not set',
        boundaryPoints: 4,
        warehouses: ['Ooty Main'],
      };
      setZones((prev) => [newZone, ...prev]);
      Alert.alert('Zone Created', `Zone ${formZoneName} (${code}) created successfully.`);
    }

    setCurrentView('list');
  };

  const handleHeaderBack = () => {
    if (currentView === 'add_location') {
      setCurrentView(previousViewBeforeAddLoc);
    } else if (currentView === 'location_management') {
      setCurrentView('details');
    } else if (currentView === 'edit_zone') {
      setCurrentView('details');
    } else if (currentView === 'zone_map') {
      setCurrentView('details');
    } else if (currentView === 'farmer_list') {
      setCurrentView('details');
    } else if (currentView === 'assign_farmers') {
      if (assignStep > 1) {
        setAssignStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      } else {
        setCurrentView(previousViewBeforeAssign);
      }
    } else if (currentView === 'bulk_assign') {
      if (bulkStep === 2) {
        setBulkStep(1);
      } else {
        setCurrentView('assign_farmers');
      }
    } else if (currentView === 'assigned_farmers') {
      setCurrentView('dashboard');
    } else if (currentView === 'farmer_transfer') {
      setCurrentView('farmer_list');
    } else if (currentView === 'warehouse_mapping') {
      setCurrentView('details');
    } else if (currentView === 'zone_reports') {
      setCurrentView('dashboard');
    } else if (currentView === 'zone_status_deactivation') {
      setCurrentView(previousViewBeforeDeactivation);
    } else if (currentView === 'add_zone') {
      setCurrentView('list');
    } else if (currentView === 'details') {
      setCurrentView('list');
    } else if (currentView === 'list') {
      setCurrentView('dashboard');
    } else {
      // From ZM-01 root, return to Super Admin More menu
      onBack();
    }
  };

  const filteredZones = zones.filter((z) => {
    const matchesSearch =
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.shortCode.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus !== 'All' && z.status !== filterStatus) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Header (Matching Screen Design) ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              {currentView === 'dashboard' && 'Zone Management'}
              {currentView === 'list' && 'Zone List'}
              {currentView === 'details' && 'Zone Details'}
              {currentView === 'add_zone' && 'Add New Zone'}
              {currentView === 'edit_zone' && 'Edit Zone'}
              {currentView === 'location_management' && 'Location Management'}
              {currentView === 'add_location' && 'Add Location'}
              {currentView === 'zone_map' && 'Zone Map & Boundary'}
              {currentView === 'farmer_list' && 'Zone Farmer List'}
              {currentView === 'assign_farmers' && 'Assign Farmers'}
              {currentView === 'bulk_assign' && 'Bulk Farmer Assignment'}
              {currentView === 'assigned_farmers' && 'Assigned Farmers'}
              {currentView === 'farmer_transfer' && 'Farmer Zone Transfer'}
              {currentView === 'warehouse_mapping' && 'Zone Warehouse Mapping'}
              {currentView === 'zone_reports' && 'Zone-wise Reports'}
              {currentView === 'zone_status_deactivation' && 'Zone Status & Deactivation'}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Main Screen Content based on currentView ─── */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 1: ZM-01 ZONE DASHBOARD
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'dashboard' && (
          <>
            {/* 8 KPI Cards using OverviewDashboardCard */}
            <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
              <OverviewDashboardCard
                title="Total Zones"
                value="5"
                icon="categories"
                tone="default"
                titlePosition="bottom"
                preserveCase
                onPress={() => setCurrentView('list')}
              />
              <OverviewDashboardCard
                title="Active Zones"
                value="4"
                icon="clipboard"
                tone="success"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Inactive Zones"
                value="1"
                icon="alert"
                tone="warning"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Total Locations"
                value="27"
                subtitle="24 in zones, 3 not in a zone"
                icon="market"
                tone="default"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Assigned Farmers"
                value="248"
                subtitle="of 260 registered"
                icon="users"
                tone="default"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Unassigned Farmers"
                value="12"
                subtitle="need a zone"
                icon="alert"
                tone="danger"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Main Warehouses"
                value="1"
                icon="building"
                tone="default"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Sub-Warehouses"
                value="3"
                icon="store"
                tone="default"
                titlePosition="bottom"
                preserveCase
              />
            </OverviewCardsGrid>

            {/* 4 Action Buttons Grid (Exact Mockup 1) */}
            <View style={styles.actionButtonsGrid}>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  activeOpacity={0.8}
                  onPress={handleNavigateToAddZone}
                >
                  <Text style={styles.primaryActionText}>Create New Zone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  activeOpacity={0.8}
                  onPress={() => setCurrentView('list')}
                >
                  <Text style={styles.secondaryActionText}>View All Zones</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  activeOpacity={0.8}
                  onPress={() => handleNavigateToAssignFarmers('dashboard')}
                >
                  <Text style={styles.secondaryActionText}>Assign Farmers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  activeOpacity={0.8}
                  onPress={handleNavigateToReports}
                >
                  <Text style={styles.secondaryActionText}>View Reports</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Zone-wise farmer distribution */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Zone-wise farmer distribution</Text>
              <View style={styles.cardContainer}>
                {[
                  { name: 'Ooty Zone', val: 92, pct: '92%' },
                  { name: 'Coonoor Zone', val: 64, pct: '64%' },
                  { name: 'Kotagiri Zone', val: 41, pct: '41%' },
                  { name: 'Gudalur Zone', val: 29, pct: '29%' },
                  { name: 'Kundah Zone', val: 22, pct: '22%' },
                ].map((item, idx) => (
                  <View key={item.name} style={[styles.distRow, idx === 4 && { marginBottom: 0 }]}>
                    <View style={styles.distTextRow}>
                      <Text style={styles.distZoneLabel}>{item.name}</Text>
                      <Text style={styles.distZoneValue}>{item.val}</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: item.pct as DimensionValue }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Zone-wise location distribution */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Zone-wise location distribution</Text>
              <View style={styles.cardContainer}>
                {[
                  { name: 'Ooty Zone', val: 6, pct: '100%' },
                  { name: 'Coonoor Zone', val: 5, pct: '83%' },
                  { name: 'Kotagiri Zone', val: 4, pct: '66%' },
                  { name: 'Gudalur Zone', val: 5, pct: '83%' },
                  { name: 'Kundah Zone', val: 4, pct: '66%' },
                ].map((item, idx) => (
                  <View key={item.name} style={[styles.distRow, idx === 4 && { marginBottom: 0 }]}>
                    <View style={styles.distTextRow}>
                      <Text style={styles.distZoneLabel}>{item.name}</Text>
                      <Text style={styles.distZoneValue}>{item.val}</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: item.pct as DimensionValue }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Zone-wise warehouse distribution */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Zone-wise warehouse distribution</Text>
              <View style={styles.cardContainer}>
                {[
                  { name: 'Ooty Zone', wh: 'Ooty Main, Coonoor Sub' },
                  { name: 'Coonoor Zone', wh: 'Coonoor Sub' },
                  { name: 'Kotagiri Zone', wh: 'Kotagiri Sub' },
                  { name: 'Gudalur Zone', wh: 'Gudalur Market Sub' },
                  { name: 'Kundah Zone', wh: 'None' },
                ].map((item, idx) => (
                  <React.Fragment key={item.name}>
                    <View style={styles.whRow}>
                      <Text style={styles.whZoneLabel}>{item.name}</Text>
                      <Text style={styles.whZoneVal}>{item.wh}</Text>
                    </View>
                    {idx < 4 ? <View style={styles.dashedDivider} /> : null}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Recently created zones */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Recently created zones</Text>
              <View style={styles.cardContainer}>
                {zones.slice(0, 3).map((zone, idx) => (
                  <React.Fragment key={zone.id}>
                    <TouchableOpacity
                      style={styles.recentZoneRow}
                      activeOpacity={0.7}
                      onPress={() => handleNavigateToDetails(zone)}
                    >
                      <View style={styles.recentZoneLeft}>
                        <Text style={styles.recentZoneName}>{zone.name}</Text>
                        <Text style={styles.recentZoneMeta}>
                          {zone.code} · created {zone.createdDate}
                        </Text>
                      </View>
                      <View
                        style={zone.status === 'Active' ? styles.activeBadge : styles.inactiveBadge}
                      >
                        <Text
                          style={
                            zone.status === 'Active'
                              ? styles.activeBadgeText
                              : styles.inactiveBadgeText
                          }
                        >
                          {zone.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {idx < 2 ? <View style={styles.dashedDivider} /> : null}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Zones requiring attention (3) */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Zones requiring attention (3)</Text>
              <View style={styles.cardContainer}>
                <TouchableOpacity
                  style={styles.attentionBlock}
                  activeOpacity={0.7}
                  onPress={() => {
                    const kundah = zones.find((z) => z.code === 'ZN-005') ?? zones[4] ?? INITIAL_ZONES[0]!;
                    handleNavigateToZoneStatus(kundah, 'dashboard');
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.attentionTitle}>Kundah Zone</Text>
                    <Text style={{ fontSize: 11, color: adminColors.brand, fontWeight: '700' }}>Review Status →</Text>
                  </View>
                  <Text style={styles.attentionDesc}>
                    22 farmers are still assigned to an inactive zone. Transfer them, or keep them frozen.
                  </Text>
                </TouchableOpacity>
                <View style={styles.dashedDivider} />

                <View style={styles.attentionBlock}>
                  <Text style={styles.attentionTitle}>Gudalur Zone</Text>
                  <Text style={styles.attentionDesc}>
                    No active warehouse mapping gap risk — verify Gudalur Market Sub stays active.
                  </Text>
                </View>
                <View style={styles.dashedDivider} />

                <View style={styles.attentionBlock}>
                  <Text style={styles.attentionTitle}>All zones</Text>
                  <Text style={styles.attentionDesc}>
                    Boundaries are schematic; 2 zone boundaries have not been reviewed for overlap.
                  </Text>
                </View>
              </View>
            </View>

            {/* Unassigned farmers */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeaderTitle}>Unassigned farmers</Text>
              <View style={styles.cardContainer}>
                {[
                  { loc: 'Farmers without a zone', count: '12' },
                  { loc: 'Registered in Masinagudi', count: '2' },
                  { loc: 'Registered in Naduvattam', count: '2' },
                  { loc: 'Registered in Sholur', count: '2' },
                  { loc: 'Registered in Ooty Town', count: '1' },
                  { loc: 'Registered in Coonoor Town', count: '1' },
                  { loc: 'Registered in Kotagiri Town', count: '1' },
                  { loc: 'Registered in Gudalur Town', count: '1' },
                  { loc: 'Registered in Devala', count: '1' },
                  { loc: 'Registered in Wellington', count: '1' },
                ].map((r, i) => (
                  <React.Fragment key={r.loc}>
                    <View style={styles.unassignedRow}>
                      <Text style={styles.unassignedLabel}>{r.loc}</Text>
                      <Text style={styles.unassignedBoldVal}>{r.count}</Text>
                    </View>
                    {i < 9 ? <View style={styles.dashedDivider} /> : null}
                  </React.Fragment>
                ))}

                <TouchableOpacity
                  style={styles.assignFullButton}
                  activeOpacity={0.8}
                  onPress={() => handleNavigateToAssignFarmers('dashboard')}
                >
                  <Text style={styles.assignFullButtonText}>Assign Farmers</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 2: ZM-02 ZONE LIST
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'list' && (
          <>
            {/* Search & Filter Card */}
            <View style={styles.filterCard}>
              <Text style={styles.filterFieldLabel}>Search zones</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Search zones"
                placeholderTextColor={adminColors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              <View style={styles.filterDropdownRow}>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Status</Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setFilterStatus(filterStatus === 'All' ? 'Active' : filterStatus === 'Active' ? 'Inactive' : 'All')}
                  >
                    <Text style={styles.dropdownVal}>{filterStatus}</Text>
                    <ChevronDownIcon />
                  </TouchableOpacity>
                </View>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>District</Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => setFilterDistrict(filterDistrict === 'All' ? 'Nilgiris' : 'All')}
                  >
                    <Text style={styles.dropdownVal}>{filterDistrict}</Text>
                    <ChevronDownIcon />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterDropdownRow}>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Farmer count</Text>
                  <View style={styles.dropdownBox}>
                    <Text style={styles.dropdownVal}>Any</Text>
                    <ChevronDownIcon />
                  </View>
                </View>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Warehouse availability</Text>
                  <View style={styles.dropdownBox}>
                    <Text style={styles.dropdownVal}>Any</Text>
                    <ChevronDownIcon />
                  </View>
                </View>
              </View>

              <View style={styles.filterButtonRow}>
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setFilterStatus('All');
                    setFilterDistrict('All');
                  }}
                >
                  <Text style={styles.clearFiltersBtnText}>Clear filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addNewZoneBtn}
                  onPress={handleNavigateToAddZone}
                >
                  <Text style={styles.addNewZoneBtnText}>Add New Zone</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Results count text */}
            <Text style={styles.resultsCountText}>
              {filteredZones.length} of {zones.length} zones
            </Text>

            {/* 5 Zone Cards (Exact Mockup ZM-02) */}
            <View style={styles.zoneCardsList}>
              {filteredZones.map((zone) => {
                const isActive = zone.status === 'Active';
                return (
                  <TouchableOpacity
                    key={zone.id}
                    style={styles.zoneListItemCard}
                    activeOpacity={0.8}
                    onPress={() => handleNavigateToDetails(zone)}
                  >
                    <View style={styles.zoneListItemHeader}>
                      <View style={styles.zoneListItemTitleRow}>
                        <Text style={styles.zoneListItemName}>{zone.name}</Text>
                        <View
                          style={isActive ? styles.activeBadge : styles.inactiveBadge}
                        >
                          <Text
                            style={
                              isActive
                                ? styles.activeBadgeText
                                : styles.inactiveBadgeText
                            }
                          >
                            {zone.status}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleNavigateToEditZone(zone)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <ThreeDotsIcon />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.zoneListItemCodeLine}>
                      {zone.code} · {zone.shortCode} · {zone.district}
                    </Text>
                    <Text style={styles.zoneListItemStatsLine}>
                      {zone.locationsCount} locations · {zone.farmersCount} farmers · {zone.warehousesCount} warehouses
                    </Text>
                    <Text style={styles.zoneListItemDateLine}>
                      Created {zone.createdDate}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 3: ZM-03 ZONE DETAILS
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'details' && (
          <>
            {/* Main Zone Card */}
            <View style={styles.cardContainer}>
              <View style={styles.zoneListItemHeader}>
                <View style={styles.zoneListItemTitleRow}>
                  <Text style={styles.zoneListItemName}>{selectedZone.name}</Text>
                  <View
                    style={
                      selectedZone.status === 'Active'
                        ? styles.activeBadge
                        : styles.inactiveBadge
                    }
                  >
                    <Text
                      style={
                        selectedZone.status === 'Active'
                          ? styles.activeBadgeText
                          : styles.inactiveBadgeText
                      }
                    >
                      {selectedZone.status}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.zoneListItemCodeLine, { marginBottom: 12 }]}>
                {selectedZone.code} · Code {selectedZone.shortCode} · {selectedZone.district}
              </Text>

              <View style={styles.detailsTableRow}>
                <Text style={styles.detailsTableLabel}>Zone manager</Text>
                <Text style={styles.detailsTableValBold}>{selectedZone.manager}</Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.detailsTableRow}>
                <Text style={styles.detailsTableLabel}>Created</Text>
                <Text style={styles.detailsTableValBold}>{selectedZone.createdDate}</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.detailsActionRow}>
                <TouchableOpacity
                  style={styles.detailsEditBtn}
                  activeOpacity={0.8}
                  onPress={() => handleNavigateToEditZone(selectedZone)}
                >
                  <Text style={styles.detailsEditBtnText}>Edit Zone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailsStatusBtn}
                  activeOpacity={0.8}
                  onPress={() => handleNavigateToZoneStatus(selectedZone, 'details')}
                >
                  <Text style={styles.detailsStatusBtnText}>Status</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Horizontal Sub-Tabs */}
            <View style={styles.detailsTabsWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                {(['Overview', 'Locations', 'Farmers', 'Warehouses'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.detailsTabPill,
                      detailsSubTab === tab && styles.detailsTabPillActive,
                    ]}
                    onPress={() => {
                      setDetailsSubTab(tab);
                      if (tab === 'Locations') {
                        handleNavigateToLocationManagement(selectedZone.name);
                      } else if (tab === 'Farmers') {
                        handleNavigateToFarmerList(selectedZone.name);
                      } else if (tab === 'Warehouses') {
                        handleNavigateToWarehouseMapping(selectedZone.name);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.detailsTabPillText,
                        detailsSubTab === tab && styles.detailsTabPillTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.scrollBarTrack}>
                <View style={styles.scrollBarThumb} />
              </View>
            </View>

            {/* 4 KPI Cards using OverviewDashboardCard */}
            <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
              <OverviewDashboardCard
                title="Locations"
                value={selectedZone.locationsCount}
                icon="market"
                tone="default"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Farmers"
                value={selectedZone.farmersCount}
                icon="users"
                tone="default"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Warehouses"
                value={selectedZone.warehousesCount}
                icon="building"
                tone="default"
                titlePosition="bottom"
                preserveCase
              />
              <OverviewDashboardCard
                title="Farm area (acres)"
                value={selectedZone.farmAreaAcres}
                icon="categories"
                tone="success"
                titlePosition="bottom"
                preserveCase
              />
            </OverviewCardsGrid>

            {/* Details Specs Card */}
            <View style={[styles.cardContainer, { marginBottom: adminSpacing.md }]}>
              <View style={styles.detailsTableRow}>
                <Text style={styles.detailsTableLabel}>Verified farmers</Text>
                <Text style={styles.detailsTableValBold}>
                  {selectedZone.verifiedFarmers} of {selectedZone.farmersCount}
                </Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.detailsTableRow}>
                <Text style={styles.detailsTableLabel}>Active farmers</Text>
                <Text style={styles.detailsTableValBold}>
                  {selectedZone.activeFarmers} of {selectedZone.farmersCount}
                </Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.detailsTableRow}>
                <Text style={styles.detailsTableLabel}>Description</Text>
                <Text style={[styles.detailsTableValBold, { flex: 1, textAlign: 'right', marginLeft: 10 }]}>
                  {selectedZone.description}
                </Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.detailsTableRow}>
                <Text style={styles.detailsTableLabel}>Contact</Text>
                <Text style={styles.detailsTableValBold}>{selectedZone.contact}</Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.detailsTableRow}>
                <Text style={styles.detailsTableLabel}>Boundary</Text>
                <Text style={styles.detailsTableValBold}>
                  {selectedZone.boundaryPoints} points
                </Text>
              </View>
            </View>

            {/* Bottom 2 Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.outlinedActionBtn}
                activeOpacity={0.8}
                onPress={() => handleNavigateToAssignFarmers('details')}
              >
                <Text style={styles.outlinedActionText}>Assign Farmers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.outlinedActionBtn}
                activeOpacity={0.8}
                onPress={() => handleNavigateToZoneMap(selectedZone.name)}
              >
                <Text style={styles.outlinedActionText}>Open Map</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 4: ZM-04 ADD / EDIT NEW ZONE
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'add_zone' && (
          <>
            <View style={styles.cardContainer}>
              <Text style={styles.inputLabelRequired}>Zone name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Zone name"
                placeholderTextColor={adminColors.muted}
                value={formZoneName}
                onChangeText={setFormZoneName}
              />

              <Text style={styles.inputLabelRequired}>Zone code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Zone code"
                placeholderTextColor={adminColors.muted}
                value={formZoneCode}
                onChangeText={setFormZoneCode}
                maxLength={5}
                autoCapitalize="characters"
              />
              <Text style={styles.inputHelperText}>
                2 to 5 capital letters.{' '}
                <Text
                  style={styles.inputHelperLink}
                  onPress={() => {
                    if (formZoneName.trim()) {
                      const words = formZoneName.trim().split(' ');
                      const code = words.map((w) => w.charAt(0).toUpperCase()).join('').slice(0, 4);
                      setFormZoneCode(code || 'ZON');
                    }
                  }}
                >
                  Suggest from the name
                </Text>
              </Text>

              <Text style={styles.inputLabelRequired}>District *</Text>
              <View style={styles.dropdownBox}>
                <Text style={styles.dropdownVal}>{formDistrict}</Text>
                <ChevronDownIcon />
              </View>

              <Text style={styles.inputLabelOptional}>
                Zone description <Text style={styles.optionalTag}>Optional</Text>
              </Text>
              <TextInput
                style={[styles.formInput, { height: 86, textAlignVertical: 'top' }]}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
              />

              <Text style={styles.inputLabelOptional}>
                Zone manager <Text style={styles.optionalTag}>Optional</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => {
                  setFormManager(
                    formManager === 'None'
                      ? 'Demo Farmer Admin One'
                      : formManager === 'Demo Farmer Admin One'
                        ? 'Demo Farmer Admin Two'
                        : 'None'
                  );
                }}
              >
                <Text style={styles.dropdownVal}>{formManager}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>
              <Text style={styles.inputHelperText}>
                A Farmer Admin account. Each Farmer Admin has one zone (rbac scope zone_id).
              </Text>

              <Text style={styles.inputLabelOptional}>
                Contact number <Text style={styles.optionalTag}>Optional</Text>
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={formContact}
                onChangeText={setFormContact}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabelOptional}>
                Zone image <Text style={styles.optionalTag}>Optional</Text>
              </Text>
              <View style={styles.dropdownBox}>
                <Text style={styles.dropdownVal}>No image</Text>
                <ChevronDownIcon />
              </View>

              <Text style={styles.inputLabel}>Zone status</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => setFormStatus(formStatus === 'Active' ? 'Inactive' : 'Active')}
              >
                <Text style={styles.dropdownVal}>{formStatus}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>
              <Text style={styles.inputHelperText}>
                Save as Draft ignores this and keeps the zone as a draft.
              </Text>

              {/* Action buttons */}
              <View style={[styles.actionRow, { marginTop: 14 }]}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  activeOpacity={0.8}
                  onPress={() => handleSaveZone(false)}
                >
                  <Text style={styles.primaryActionText}>Save Zone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  activeOpacity={0.8}
                  onPress={() => handleSaveZone(true)}
                >
                  <Text style={styles.secondaryActionText}>Save as Draft</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelFullBtn}
                activeOpacity={0.8}
                onPress={() => setCurrentView('list')}
              >
                <Text style={styles.cancelFullBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 5: ZM-05 EDIT ZONE (Images 1 & 2)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'edit_zone' && (() => {
          const zoneAssignedLocations = locations.filter(
            (l) => l.zoneId === selectedZone.id || l.zoneName.includes(selectedZone.shortCode)
          );
          return (
            <>
              {/* Form Card */}
              <View style={styles.cardContainer}>
                <Text style={styles.inputLabelRequired}>Zone name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Zone name"
                  placeholderTextColor={adminColors.muted}
                  value={formZoneName}
                  onChangeText={setFormZoneName}
                />

                <Text style={styles.inputLabelRequired}>Zone code *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Zone code"
                  placeholderTextColor={adminColors.muted}
                  value={formZoneCode}
                  onChangeText={setFormZoneCode}
                  maxLength={5}
                  autoCapitalize="characters"
                />
                <Text style={styles.inputHelperText}>
                  Changing the name or code does not change farmer, order or warehouse IDs.
                </Text>

                <Text style={styles.inputLabelOptional}>
                  Zone description <Text style={styles.optionalTag}>Optional</Text>
                </Text>
                <TextInput
                  style={[styles.formInput, { height: 78, textAlignVertical: 'top' }]}
                  placeholder=""
                  placeholderTextColor={adminColors.muted}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                />

                <Text style={styles.inputLabelOptional}>
                  Zone manager <Text style={styles.optionalTag}>Optional</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBox}
                  onPress={() => {
                    setFormManager(
                      formManager === 'None'
                        ? 'Demo Farmer Admin One'
                        : formManager === 'Demo Farmer Admin One'
                          ? 'Demo Farmer Admin Two'
                          : 'None'
                    );
                  }}
                >
                  <Text style={styles.dropdownVal}>{formManager}</Text>
                  <ChevronDownIcon />
                </TouchableOpacity>

                <Text style={styles.inputLabelOptional}>
                  Contact number <Text style={styles.optionalTag}>Optional</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder=""
                  placeholderTextColor={adminColors.muted}
                  value={formContact}
                  onChangeText={setFormContact}
                  keyboardType="phone-pad"
                />

                {/* Status Row with Active badge */}
                <View style={[styles.detailsTableRow, { marginTop: 14 }]}>
                  <Text style={styles.detailsTableLabel}>Status</Text>
                  <View
                    style={
                      formStatus === 'Active' ? styles.activeBadge : styles.inactiveBadge
                    }
                  >
                    <Text
                      style={
                        formStatus === 'Active'
                          ? styles.activeBadgeText
                          : styles.inactiveBadgeText
                      }
                    >
                      {formStatus}
                    </Text>
                  </View>
                </View>
                <View style={styles.dashedDivider} />
                <Text style={styles.inputHelperText}>
                  Status changes (deactivate, reactivate, archive) go through the dependency checks in Zone Status.
                </Text>
                <TouchableOpacity
                  style={{ marginTop: 6 }}
                  onPress={() => handleNavigateToZoneStatus(selectedZone, 'edit_zone')}
                >
                  <Text style={{ fontSize: 12, color: adminColors.brand, fontWeight: '700' }}>
                    Open Zone Status & Deactivation →
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Assigned Locations Section */}
              <Text style={styles.sectionHeading}>
                Assigned locations ({zoneAssignedLocations.length})
              </Text>
              <View style={styles.cardContainer}>
                {zoneAssignedLocations.map((loc, idx) => (
                  <View key={loc.id}>
                    <View style={styles.assignedLocationRow}>
                      <View style={styles.assignedLocationLeft}>
                        <Text style={styles.assignedLocationName}>{loc.name}</Text>
                        <Text style={styles.assignedLocationMeta}>
                          {loc.code} · {loc.farmersCount} farmers
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeLocButton}
                        activeOpacity={0.8}
                        onPress={() => handleRemoveLocation(loc.id)}
                      >
                        <Text style={styles.removeLocButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                    {idx < zoneAssignedLocations.length - 1 && <View style={styles.dashedDivider} />}
                  </View>
                ))}

                {/* 2 Buttons below locations list */}
                <View style={[styles.actionRow, { marginTop: 12 }]}>
                  <TouchableOpacity
                    style={styles.outlinedActionBtn}
                    activeOpacity={0.8}
                    onPress={() => handleNavigateToLocationManagement(selectedZone.name)}
                  >
                    <Text style={styles.outlinedActionText}>Add existing location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.outlinedActionBtn}
                    activeOpacity={0.8}
                    onPress={() => handleNavigateToAddLocation(selectedZone.name, 'edit_zone')}
                  >
                    <Text style={styles.outlinedActionText}>Add new location</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Change History Section */}
              <Text style={styles.sectionHeading}>Change history</Text>
              <View style={styles.cardContainer}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyTimestamp}>2026-03-12 09:00</Text>
                  <Text style={styles.historyActionText}>
                    Zone created · <Text style={{ fontWeight: '800' }}>Demo Super Admin</Text>
                  </Text>
                </View>
              </View>

              {/* Bottom Buttons */}
              <View style={[styles.actionRow, { marginTop: 14, marginBottom: 20 }]}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleSaveZone(false);
                    setCurrentView('details');
                  }}
                >
                  <Text style={styles.primaryActionText}>Review Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  activeOpacity={0.8}
                  onPress={() => setCurrentView('details')}
                >
                  <Text style={styles.secondaryActionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 6: ZM-06 LOCATION MANAGEMENT (Images 3 & 4)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'location_management' && (() => {
          const matchedZone =
            zones.find(
              (z) =>
                selectedLocationZone.includes(z.shortCode) ||
                selectedLocationZone.includes(z.name)
            ) || selectedZone;

          const zoneLocations = locations.filter(
            (l) => l.zoneId === matchedZone.id || l.zoneName.includes(matchedZone.shortCode)
          );

          const filteredLocations = zoneLocations.filter((loc) => {
            if (
              locationSearchQuery.trim() &&
              !loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) &&
              !loc.code.toLowerCase().includes(locationSearchQuery.toLowerCase()) &&
              !loc.pinCode.includes(locationSearchQuery)
            ) {
              return false;
            }
            if (locationFilterType !== 'All' && loc.type !== locationFilterType) {
              return false;
            }
            if (locationFilterStatus !== 'All' && loc.status !== locationFilterStatus) {
              return false;
            }
            return true;
          });

          return (
            <>
              {/* Zone Selector Card */}
              <View style={styles.cardContainer}>
                <Text style={styles.inputLabelRequired}>Zone</Text>
                <TouchableOpacity
                  style={styles.dropdownBox}
                  onPress={() => {
                    const idx = zones.findIndex((z) => `${z.name} (${z.shortCode})` === selectedLocationZone);
                    const nextIdx = (idx + 1) % zones.length;
                    const nextZone = zones[nextIdx];
                    if (nextZone) {
                      setSelectedLocationZone(`${nextZone.name} (${nextZone.shortCode})`);
                    }
                  }}
                >
                  <Text style={styles.dropdownVal}>{selectedLocationZone}</Text>
                  <ChevronDownIcon />
                </TouchableOpacity>
              </View>

              {/* Search & Filters Card */}
              <View style={styles.cardContainer}>
                <Text style={styles.inputLabel}>Search locations</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder=""
                  placeholderTextColor={adminColors.muted}
                  value={locationSearchQuery}
                  onChangeText={setLocationSearchQuery}
                />

                <View style={styles.filterDropdownRow}>
                  <View style={styles.filterDropdownCol}>
                    <Text style={styles.filterFieldLabel}>Type</Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => {
                        const types = ['All', 'Town', 'Village', 'Locality'];
                        const idx = types.indexOf(locationFilterType);
                        setLocationFilterType(types[(idx + 1) % types.length] ?? 'All');
                      }}
                    >
                      <Text style={styles.dropdownVal}>{locationFilterType}</Text>
                      <ChevronDownIcon />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.filterDropdownCol}>
                    <Text style={styles.filterFieldLabel}>Status</Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => {
                        const statuses = ['All', 'Active', 'Inactive'];
                        const idx = statuses.indexOf(locationFilterStatus);
                        setLocationFilterStatus(statuses[(idx + 1) % statuses.length] ?? 'All');
                      }}
                    >
                      <Text style={styles.dropdownVal}>{locationFilterStatus}</Text>
                      <ChevronDownIcon />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Add Location Primary Button */}
                <TouchableOpacity
                  style={[styles.primaryActionButton, { marginTop: 14 }]}
                  activeOpacity={0.8}
                  onPress={() => handleNavigateToAddLocation(selectedLocationZone, 'location_management')}
                >
                  <Text style={styles.primaryActionText}>Add Location</Text>
                </TouchableOpacity>
              </View>

              {/* Location Count Heading */}
              <Text style={styles.resultsCountText}>
                {filteredLocations.length} of {zoneLocations.length} locations in {matchedZone.name}
              </Text>

              {/* Location Cards List */}
              <View style={styles.zoneCardsList}>
                {filteredLocations.map((loc) => {
                  const isActive = loc.status === 'Active';
                  return (
                    <View key={loc.id} style={styles.locationCard}>
                      <View style={styles.zoneListItemHeader}>
                        <View style={styles.zoneListItemTitleRow}>
                          <Text style={styles.zoneListItemName}>{loc.name}</Text>
                          <View
                            style={isActive ? styles.activeBadge : styles.inactiveBadge}
                          >
                            <Text
                              style={
                                isActive
                                  ? styles.activeBadgeText
                                  : styles.inactiveBadgeText
                              }
                            >
                              {loc.status}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.zoneListItemCodeLine}>
                        {loc.type} · {loc.district}
                      </Text>
                      <Text style={[styles.zoneListItemStatsLine, { marginBottom: 12 }]}>
                        PIN {loc.pinCode} · {loc.farmersCount} assigned farmers
                      </Text>

                      {/* Action buttons row: Edit & Deactivate */}
                      <View style={styles.locationCardActionsRow}>
                        <TouchableOpacity
                          style={styles.locationOutlineBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            setNewLocZone(`${matchedZone.name} (${matchedZone.shortCode})`);
                            setNewLocName(loc.name);
                            setNewLocType(loc.type);
                            setNewLocTaluk(loc.taluk);
                            setNewLocPin(loc.pinCode);
                            setNewLocLat(loc.latitude || '11.4102');
                            setNewLocLong(loc.longitude || '76.6950');
                            setPreviousViewBeforeAddLoc('location_management');
                            setCurrentView('add_location');
                          }}
                        >
                          <Text style={styles.locationOutlineBtnText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.locationOutlineBtn}
                          activeOpacity={0.8}
                          onPress={() => handleToggleLocationStatus(loc.id)}
                        >
                          <Text style={styles.locationOutlineBtnText}>
                            {isActive ? 'Deactivate' : 'Activate'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 7: ZM-07 ADD LOCATION (Image 5)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'add_location' && (
          <>
            {/* Form Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.inputLabelRequired}>Zone *</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => {
                  const idx = zones.findIndex((z) => `${z.name} (${z.shortCode})` === newLocZone);
                  const nextIdx = (idx + 1) % zones.length;
                  const nextZone = zones[nextIdx];
                  if (nextZone) {
                    setNewLocZone(`${nextZone.name} (${nextZone.shortCode})`);
                  }
                }}
              >
                <Text style={styles.dropdownVal}>{newLocZone}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>

              <Text style={styles.inputLabelRequired}>Location name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={newLocName}
                onChangeText={setNewLocName}
              />

              <Text style={styles.inputLabelRequired}>Location type *</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => {
                  const types: Array<'Village' | 'Town' | 'Locality'> = ['Village', 'Town', 'Locality'];
                  const idx = types.indexOf(newLocType);
                  setNewLocType(types[(idx + 1) % types.length] ?? 'Village');
                }}
              >
                <Text style={styles.dropdownVal}>{newLocType}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>

              <Text style={styles.inputLabelRequired}>District</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: adminColors.canvas, color: adminColors.muted }]}
                value="Nilgiris"
                editable={false}
              />

              <Text style={styles.inputLabelRequired}>Taluk / Block *</Text>
              <TextInput
                style={styles.formInput}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={newLocTaluk}
                onChangeText={setNewLocTaluk}
              />

              <Text style={styles.inputLabelRequired}>PIN code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={newLocPin}
                onChangeText={setNewLocPin}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            {/* Map Location Section */}
            <Text style={styles.sectionHeading}>Map location</Text>
            <View style={styles.cardContainer}>
              <Text style={styles.inputLabel}>Search a place</Text>
              <TextInput
                style={styles.formInput}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={newLocSearchPlace}
                onChangeText={setNewLocSearchPlace}
              />

              {/* Schematic Map Container */}
              <TouchableOpacity
                style={styles.schematicMapBox}
                activeOpacity={0.85}
                onPress={() => {
                  setPinDropped(true);
                  setNewLocLat('11.4128');
                  setNewLocLong('76.6983');
                }}
              >
                {pinDropped ? (
                  <View style={styles.mapPinIndicator}>
                    <View style={styles.mapPinDot} />
                    <Text style={styles.mapPinText}>Pin dropped: 11.4128° N, 76.6983° E</Text>
                  </View>
                ) : (
                  <Text style={styles.schematicMapText}>
                    Schematic map — tap to drop a pin
                  </Text>
                )}
              </TouchableOpacity>

              {/* Coordinates row */}
              <View style={[styles.filterDropdownRow, { marginTop: 10 }]}>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Latitude</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      !pinDropped && { backgroundColor: adminColors.canvas, color: adminColors.muted },
                    ]}
                    placeholder="From the pin"
                    placeholderTextColor={adminColors.muted}
                    value={pinDropped ? newLocLat : ''}
                    editable={pinDropped}
                    onChangeText={setNewLocLat}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Longitude</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      !pinDropped && { backgroundColor: adminColors.canvas, color: adminColors.muted },
                    ]}
                    placeholder="From the pin"
                    placeholderTextColor={adminColors.muted}
                    value={pinDropped ? newLocLong : ''}
                    editable={pinDropped}
                    onChangeText={setNewLocLong}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Status & Notes Card (Image 1) */}
            <View style={styles.cardContainer}>
              <Text style={styles.inputLabel}>Status</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() =>
                  setNewLocStatus(newLocStatus === 'Active' ? 'Inactive' : 'Active')
                }
              >
                <Text style={styles.dropdownVal}>{newLocStatus}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Notes Optional</Text>
              <TextInput
                style={[styles.formInput, { height: 90, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={3}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={newLocNotes}
                onChangeText={setNewLocNotes}
              />
            </View>

            {/* Action Buttons */}
            <View style={[styles.actionRow, { marginTop: 14, marginBottom: 20 }]}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.8}
                onPress={handleSaveNewLocation}
              >
                <Text style={styles.primaryActionText}>Save Location</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                activeOpacity={0.8}
                onPress={() => setCurrentView(previousViewBeforeAddLoc)}
              >
                <Text style={styles.secondaryActionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 8: ZM-08 ZONE MAP & BOUNDARY
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'zone_map' && (
          <>
            {/* Tool Chips Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mapToolChipsContainer}
            >
              {(['View', 'Add pin', 'Select', 'Draw boundary', 'Edit boundary'] as const).map((tool) => {
                const isActive = mapSelectedTool === tool;
                return (
                  <TouchableOpacity
                    key={tool}
                    style={[
                      styles.mapToolChip,
                      isActive && styles.mapToolChipActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setMapSelectedTool(tool)}
                  >
                    <Text
                      style={[
                        styles.mapToolChipText,
                        isActive && styles.mapToolChipTextActive,
                      ]}
                    >
                      {tool}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Scroll Indicator */}
            <View style={styles.scrollIndicatorWrap}>
              <Text style={styles.scrollIndicatorArrow}>◀</Text>
              <View style={styles.scrollIndicatorBar}>
                <View
                  style={[
                    styles.scrollIndicatorThumb,
                    mapSelectedTool === 'View' && { left: '0%' },
                    mapSelectedTool === 'Add pin' && { left: '15%' },
                    mapSelectedTool === 'Select' && { left: '35%' },
                    mapSelectedTool === 'Draw boundary' && { left: '55%' },
                    mapSelectedTool === 'Edit boundary' && { left: '75%' },
                  ]}
                />
              </View>
              <Text style={styles.scrollIndicatorArrow}>▶</Text>
            </View>

            {/* Interactive Schematic Map Card */}
            <View style={styles.mapCanvasCard}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => {
                  const { locationX, locationY } = e.nativeEvent;
                  if (mapSelectedTool === 'Add pin') {
                    setDroppedPinCoords({ x: Math.round(locationX), y: Math.round(locationY) });
                  } else if (mapSelectedTool === 'Draw boundary') {
                    setDrawnBoundaryPoints((prev) => [
                      ...prev,
                      { x: Math.round(locationX), y: Math.round(locationY) },
                    ]);
                  } else if (mapSelectedTool === 'Select') {
                    setSelectedMarkersCount((prev) => prev + 1);
                  }
                }}
              >
                <Svg width="100%" height={260} viewBox="0 0 340 260">
                  {/* Grid Background */}
                  <Rect x="0" y="0" width="340" height="260" rx={adminRadius.lg} fill={adminColors.success.bg} fillOpacity={0.55} />

                  {/* Grid Lines */}
                  {[25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325].map((gx) => (
                    <Line
                      key={`gx-${gx}`}
                      x1={gx}
                      y1="0"
                      x2={gx}
                      y2="260"
                      stroke={adminColors.border}
                      strokeOpacity={0.65}
                      strokeWidth="1"
                    />
                  ))}
                  {[25, 50, 75, 100, 125, 150, 175, 200, 225, 250].map((gy) => (
                    <Line
                      key={`gy-${gy}`}
                      x1="0"
                      y1={gy}
                      x2="340"
                      y2={gy}
                      stroke={adminColors.border}
                      strokeOpacity={0.65}
                      strokeWidth="1"
                    />
                  ))}

                  {/* 1. Zone GUD (Gudalur) - Top Left */}
                  <Rect
                    x="16"
                    y="14"
                    width="88"
                    height="112"
                    rx="3"
                    stroke={adminColors.purple.text}
                    strokeWidth="1.6"
                    fill={adminColors.purple.bg}
                    fillOpacity={0.55}
                  />
                  <SvgText x="60" y="52" fill={adminColors.ink} fontSize="10.5" fontWeight="800" textAnchor="middle">
                    GUD
                  </SvgText>
                  {/* GUD Pins */}
                  <Circle cx="38" cy="30" r="5.5" fill={adminColors.purple.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="38" y="43" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">4</SvgText>

                  <Circle cx="76" cy="40" r="5.5" fill={adminColors.purple.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="76" y="53" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">7</SvgText>

                  <Circle cx="52" cy="68" r="5.5" fill={adminColors.purple.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="52" y="81" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">14</SvgText>

                  <Circle cx="32" cy="94" r="5.5" fill={adminColors.purple.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="32" y="107" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">10</SvgText>

                  <Circle cx="82" cy="92" r="5.5" fill={adminColors.purple.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="82" y="105" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">3</SvgText>

                  {/* 2. Zone OOT (Ooty) - Top Center */}
                  <Rect
                    x="116"
                    y="14"
                    width="104"
                    height="72"
                    rx="3"
                    stroke={adminColors.brand}
                    strokeWidth="2"
                    fill={adminColors.brandTint}
                    fillOpacity={0.65}
                  />
                  <SvgText x="168" y="30" fill={adminColors.ink} fontSize="10.5" fontWeight="800" textAnchor="middle">
                    OOT
                  </SvgText>
                  {/* OOT Pins */}
                  <Circle cx="136" cy="28" r="5.5" fill={adminColors.brand} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="136" y="41" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">12</SvgText>

                  <Circle cx="192" cy="28" r="5.5" fill={adminColors.brand} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="192" y="41" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">18</SvgText>

                  <Circle cx="168" cy="46" r="5.5" fill={adminColors.brand} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="168" y="59" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">30</SvgText>

                  <Circle cx="134" cy="62" r="5.5" fill={adminColors.brand} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="134" y="75" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">7</SvgText>

                  <Circle cx="160" cy="68" r="5.5" fill={adminColors.brand} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="160" y="81" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">5</SvgText>

                  <Circle cx="200" cy="62" r="5.5" fill={adminColors.brand} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="200" y="75" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">10</SvgText>

                  {/* 3. Zone COO (Coonoor) - Center Middle */}
                  <Rect
                    x="126"
                    y="94"
                    width="94"
                    height="62"
                    rx="3"
                    stroke={adminColors.success.text}
                    strokeWidth="1.6"
                    fill={adminColors.success.bg}
                    fillOpacity={0.6}
                  />
                  <SvgText x="173" y="108" fill={adminColors.ink} fontSize="10.5" fontWeight="800" textAnchor="middle">
                    COO
                  </SvgText>
                  {/* COO Pins */}
                  <Circle cx="142" cy="104" r="5.5" fill={adminColors.success.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="142" y="117" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">6</SvgText>

                  <Circle cx="196" cy="102" r="5.5" fill={adminColors.success.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="196" y="115" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">16</SvgText>

                  <Circle cx="173" cy="118" r="5.5" fill={adminColors.success.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="173" y="131" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">22</SvgText>

                  <Circle cx="150" cy="134" r="5.5" fill={adminColors.success.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="150" y="147" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">12</SvgText>

                  <Circle cx="202" cy="136" r="5.5" fill={adminColors.success.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="202" y="149" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">8</SvgText>

                  {/* 4. Zone KOT (Kotagiri) - Right */}
                  <Rect
                    x="230"
                    y="72"
                    width="90"
                    height="86"
                    rx="3"
                    stroke={adminColors.info.text}
                    strokeWidth="1.6"
                    fill={adminColors.info.bg}
                    fillOpacity={0.6}
                  />
                  <SvgText x="275" y="90" fill={adminColors.ink} fontSize="10.5" fontWeight="800" textAnchor="middle">
                    KOT
                  </SvgText>
                  {/* KOT Pins */}
                  <Circle cx="296" cy="84" r="5.5" fill={adminColors.info.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="296" y="97" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">12</SvgText>

                  <Circle cx="272" cy="104" r="5.5" fill={adminColors.info.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="272" y="117" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">16</SvgText>

                  <Circle cx="248" cy="126" r="5.5" fill={adminColors.info.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="248" y="139" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">9</SvgText>

                  <Circle cx="290" cy="132" r="5.5" fill={adminColors.info.text} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="290" y="145" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">5</SvgText>

                  {/* 5. Zone KUN (Kundah) - Bottom Left */}
                  <Rect
                    x="16"
                    y="134"
                    width="98"
                    height="74"
                    rx="3"
                    stroke={adminColors.muted}
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                    fill={adminColors.canvas}
                    fillOpacity={0.5}
                  />
                  <SvgText x="65" y="152" fill={adminColors.ink} fontSize="10.5" fontWeight="800" textAnchor="middle">
                    KUN
                  </SvgText>
                  {/* KUN Pins */}
                  <Circle cx="94" cy="144" r="5.5" fill={adminColors.muted} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="94" y="157" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">6</SvgText>

                  <Circle cx="64" cy="164" r="5.5" fill={adminColors.muted} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="64" y="177" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">9</SvgText>

                  <Circle cx="38" cy="178" r="5.5" fill={adminColors.muted} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="38" y="191" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">4</SvgText>

                  <Circle cx="96" cy="182" r="5.5" fill={adminColors.muted} stroke={adminColors.onBrand} strokeWidth="1.5" />
                  <SvgText x="96" y="195" fill={adminColors.ink} fontSize="7.5" fontWeight="700" textAnchor="middle">3</SvgText>

                  {/* 6. Unassigned Pins (outside zones) */}
                  <Circle cx="116" cy="120" r="5" fill={adminColors.muted} stroke={adminColors.onBrand} strokeWidth="1.2" />
                  <SvgText x="116" y="131" fill={adminColors.ink} fontSize="6.5" fontWeight="700" textAnchor="middle">0</SvgText>

                  <Circle cx="268" cy="26" r="5" fill={adminColors.muted} stroke={adminColors.onBrand} strokeWidth="1.2" />
                  <SvgText x="268" y="37" fill={adminColors.ink} fontSize="6.5" fontWeight="700" textAnchor="middle">0</SvgText>

                  <Circle cx="305" cy="30" r="5" fill={adminColors.muted} stroke={adminColors.onBrand} strokeWidth="1.2" />
                  <SvgText x="305" y="41" fill={adminColors.ink} fontSize="6.5" fontWeight="700" textAnchor="middle">0</SvgText>

                  {/* 7. Edit Boundary Handles (OOT mode) */}
                  {mapSelectedTool === 'Edit boundary' && (
                    <G>
                      {[
                        { x: 116, y: 14 },
                        { x: 168, y: 14 },
                        { x: 220, y: 14 },
                        { x: 220, y: 50 },
                        { x: 220, y: 86 },
                        { x: 168, y: 86 },
                        { x: 116, y: 86 },
                        { x: 116, y: 50 },
                      ].map((hp, hIdx) => (
                        <Circle
                          key={`handle-${hIdx}`}
                          cx={hp.x}
                          cy={hp.y}
                          r={5.5}
                          fill={adminColors.onBrand}
                          stroke={adminColors.brand}
                          strokeWidth={2.5}
                        />
                      ))}
                    </G>
                  )}

                  {/* 8. Dropped Pin (Add pin mode) */}
                  {mapSelectedTool === 'Add pin' && droppedPinCoords && (
                    <G>
                      <Circle
                        cx={droppedPinCoords.x}
                        cy={droppedPinCoords.y}
                        r={12}
                        fill={adminColors.brandTint}
                        fillOpacity={0.85}
                      />
                      <Circle
                        cx={droppedPinCoords.x}
                        cy={droppedPinCoords.y}
                        r={6.5}
                        fill={adminColors.brand}
                        stroke={adminColors.onBrand}
                        strokeWidth={2}
                      />
                    </G>
                  )}

                  {/* 9. Drawn Boundary Points (Draw mode) */}
                  {mapSelectedTool === 'Draw boundary' && drawnBoundaryPoints.length > 0 && (
                    <G>
                      {drawnBoundaryPoints.map((pt, pIdx) => {
                        const prevPt = pIdx > 0 ? drawnBoundaryPoints[pIdx - 1] : undefined;
                        return (
                          <React.Fragment key={`dp-${pIdx}`}>
                            {prevPt && (
                              <Line
                                x1={prevPt.x}
                                y1={prevPt.y}
                                x2={pt.x}
                                y2={pt.y}
                                stroke={adminColors.brand}
                                strokeWidth={2}
                                strokeDasharray="4 2"
                              />
                            )}
                            <Circle
                              cx={pt.x}
                              cy={pt.y}
                              r={5.5}
                              fill={adminColors.brand}
                              stroke={adminColors.onBrand}
                              strokeWidth={1.5}
                            />
                          </React.Fragment>
                        );
                      })}
                    </G>
                  )}
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Helper Text below map */}
            <Text style={styles.mapCanvasHelperText}>
              {mapSelectedTool === 'View' &&
                'Tap a zone to focus it. Numbers show farmers at each location.'}
              {mapSelectedTool === 'Add pin' &&
                'Tap the map to drop a pin, then add a location there.'}
              {mapSelectedTool === 'Select' &&
                'Tap markers to select several locations.'}
              {mapSelectedTool === 'Draw boundary' &&
                'Tap the map to add boundary points (3 or more). Tap Review when done.'}
              {mapSelectedTool === 'Edit boundary' &&
                'Tap a point to select it, then tap the map to move it.'}
            </Text>

            {/* Contextual Action Card */}
            {mapSelectedTool === 'Add pin' && (
              <View style={styles.mapActionSingleCard}>
                <Text style={styles.mapActionMutedText}>
                  {droppedPinCoords
                    ? `Pin dropped at (${droppedPinCoords.x}, ${droppedPinCoords.y})`
                    : 'No pin yet.'}
                </Text>
              </View>
            )}

            {mapSelectedTool === 'Select' && (
              <View style={styles.mapActionOverviewCard}>
                <View style={styles.mapMetricRow}>
                  <Text style={styles.mapMetricLabel}>Selected</Text>
                  <Text style={styles.mapMetricValue}>{selectedMarkersCount}</Text>
                </View>
                <View style={styles.reportDashedDivider} />
                <View style={styles.mapActionBtnRow}>
                  <TouchableOpacity
                    style={[
                      styles.mapActionHalfBtn,
                      selectedMarkersCount > 0 && styles.mapActionHalfBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (selectedMarkersCount > 0) {
                        Alert.alert('Locations Added', `${selectedMarkersCount} locations assigned to Ooty Zone.`);
                        setSelectedMarkersCount(0);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.mapActionHalfBtnText,
                        selectedMarkersCount > 0 && styles.mapActionHalfBtnActiveText,
                      ]}
                    >
                      Add to OOT
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapActionHalfBtn}
                    activeOpacity={0.8}
                    onPress={() => setSelectedMarkersCount(0)}
                  >
                    <Text style={styles.mapActionHalfBtnText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mapSelectedTool === 'Draw boundary' && (
              <View style={styles.mapActionOverviewCard}>
                <View style={styles.mapMetricRow}>
                  <Text style={styles.mapMetricLabel}>Points</Text>
                  <Text style={styles.mapMetricValue}>{drawnBoundaryPoints.length}</Text>
                </View>
                <View style={styles.reportDashedDivider} />
                <View style={styles.mapActionBtnRow}>
                  <TouchableOpacity
                    style={styles.mapActionHalfBtn}
                    activeOpacity={0.8}
                    onPress={() => setDrawnBoundaryPoints((prev) => prev.slice(0, -1))}
                  >
                    <Text style={styles.mapActionHalfBtnText}>Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapActionHalfBtn}
                    activeOpacity={0.8}
                    onPress={() => setDrawnBoundaryPoints([])}
                  >
                    <Text style={styles.mapActionHalfBtnText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.mapActionFullBtn,
                    drawnBoundaryPoints.length >= 3 && styles.mapActionFullBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (drawnBoundaryPoints.length >= 3) {
                      Alert.alert(
                        'Review Boundary',
                        `New zone boundary polygon drawn with ${drawnBoundaryPoints.length} vertices. Save changes?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Save Boundary',
                            onPress: () => {
                              Alert.alert('Saved', 'Zone boundary saved.');
                              setDrawnBoundaryPoints([]);
                              setMapSelectedTool('View');
                            },
                          },
                        ]
                      );
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.mapActionFullBtnText,
                      drawnBoundaryPoints.length >= 3 && styles.mapActionFullBtnActiveText,
                    ]}
                  >
                    Review and Save
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {mapSelectedTool === 'Edit boundary' && (
              <View style={styles.mapActionOverviewCard}>
                <View style={styles.mapMetricRow}>
                  <Text style={styles.mapMetricLabel}>Points</Text>
                  <Text style={styles.mapMetricValue}>4</Text>
                </View>
                <View style={styles.reportDashedDivider} />
                <View style={styles.mapMetricRow}>
                  <Text style={styles.mapMetricLabel}>Area (map units)</Text>
                  <Text style={styles.mapMetricValue}>924</Text>
                </View>
                <View style={styles.reportDashedDivider} />
                <View style={styles.mapActionBtnRow}>
                  <TouchableOpacity
                    style={styles.mapActionHalfBtn}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Point Removed', 'Corner control point removed.')}
                  >
                    <Text style={styles.mapActionHalfBtnText}>Remove point</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapActionHalfOutlineBtn}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert('Boundary Reset', 'Boundary restored to original coordinates.')}
                  >
                    <Text style={styles.mapActionHalfOutlineBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.mapActionFullBtn, styles.mapActionFullBtnActive]}
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Boundary Saved', 'Ooty Zone boundary updated successfully.')}
                >
                  <Text style={[styles.mapActionFullBtnText, styles.mapActionFullBtnActiveText]}>
                    Review and Save
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Overlapping Boundaries Section */}
            <View style={styles.mapSectionHeaderWrap}>
              <Text style={styles.mapSectionHeaderText}>Overlapping boundaries</Text>
            </View>
            <View style={styles.mapOverlapCard}>
              <Text style={styles.mapOverlapText}>No zone boundaries overlap.</Text>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 9: ZM-09 ZONE FARMER LIST (Images 3 & 4)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'farmer_list' && (
          <>
            {/* Zone Selector Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.filterFieldLabel}>Zone</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => {
                  const idx = zones.findIndex((z) => `${z.name} (${z.shortCode})` === farmerSelectedZone);
                  const nextIdx = (idx + 1) % zones.length;
                  const nextZone = zones[nextIdx];
                  if (nextZone) {
                    setFarmerSelectedZone(`${nextZone.name} (${nextZone.shortCode})`);
                  }
                }}
              >
                <Text style={styles.dropdownVal}>{farmerSelectedZone}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>

            {/* Search & Filters Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.filterFieldLabel}>Search farmers</Text>
              <TextInput
                style={styles.formInput}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={farmerSearchQuery}
                onChangeText={setFarmerSearchQuery}
              />

              <View style={styles.filterDropdownRow}>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Location</Text>
                  <View style={styles.dropdownBox}>
                    <Text style={styles.dropdownVal}>{farmerFilterLocation}</Text>
                    <ChevronDownIcon />
                  </View>
                </View>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Farmer status</Text>
                  <View style={styles.dropdownBox}>
                    <Text style={styles.dropdownVal}>{farmerFilterStatus}</Text>
                    <ChevronDownIcon />
                  </View>
                </View>
              </View>

              <View style={styles.filterDropdownRow}>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Farming type</Text>
                  <View style={styles.dropdownBox}>
                    <Text style={styles.dropdownVal}>{farmerFilterType}</Text>
                    <ChevronDownIcon />
                  </View>
                </View>
                <View style={styles.filterDropdownCol}>
                  <Text style={styles.filterFieldLabel}>Verification</Text>
                  <View style={styles.dropdownBox}>
                    <Text style={styles.dropdownVal}>{farmerFilterVerification}</Text>
                    <ChevronDownIcon />
                  </View>
                </View>
              </View>

              <View style={[styles.actionRow, { marginTop: 10 }]}>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Export List', `Exporting farmer roster for ${farmerSelectedZone}.`)}
                >
                  <Text style={styles.secondaryActionText}>Export List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  activeOpacity={0.8}
                  onPress={() => handleNavigateToAssignFarmers('farmer_list')}
                >
                  <Text style={styles.primaryActionText}>Assign Farmers</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Results Count Header & Filtered Farmer Cards */}
            {(() => {
              const zoneObj = zones.find(
                (z) => `${z.name} (${z.shortCode})` === farmerSelectedZone
              );
              const q = farmerSearchQuery.trim().toLowerCase();
              const zoneFarmers = farmersList.filter(
                (f) => !zoneObj || f.zoneId === zoneObj.id
              );
              const zoneFilteredFarmers = zoneFarmers.filter(
                (f) =>
                  !q ||
                  f.name.toLowerCase().includes(q) ||
                  f.code.toLowerCase().includes(q) ||
                  f.location.toLowerCase().includes(q)
              );
              const zoneTotalCount = Math.max(
                zoneFilteredFarmers.length,
                zoneObj?.farmersCount ?? zoneFilteredFarmers.length
              );

              return (
                <>
                  <Text style={styles.farmerCountHeader}>
                    {zoneFilteredFarmers.length} of {zoneTotalCount} farmers in{' '}
                    {farmerSelectedZone.split(' (')[0]}
                  </Text>

                  {zoneFilteredFarmers.length === 0 ? (
                    <View style={styles.cardContainer}>
                      <Text style={styles.farmerMetaText}>
                        No matching farmers found in {farmerSelectedZone.split(' (')[0]}.
                      </Text>
                    </View>
                  ) : (
                    zoneFilteredFarmers.map((farmer) => (
                      <View key={farmer.id} style={styles.farmerCard}>
                        <View style={styles.farmerCardHeader}>
                          <Text style={styles.farmerName}>{farmer.name}</Text>
                          <View style={styles.farmerBadgeRow}>
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>{farmer.status}</Text>
                            </View>
                            <View
                              style={
                                farmer.verification === 'Verified'
                                  ? styles.verifiedBadge
                                  : styles.pendingBadge
                              }
                            >
                              <Text
                                style={
                                  farmer.verification === 'Verified'
                                    ? styles.verifiedBadgeText
                                    : styles.pendingBadgeText
                                }
                              >
                                {farmer.verification}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Text style={styles.farmerCodeLoc}>
                          {farmer.code} · {farmer.location}
                        </Text>
                        <Text style={styles.farmerMetaText}>
                          {farmer.phone} · {farmer.farmingType} · {farmer.acres} acres
                        </Text>

                        <View style={styles.farmerCardBtnRow}>
                          <TouchableOpacity
                            style={styles.farmerCardBtn}
                            activeOpacity={0.8}
                            onPress={() =>
                              Alert.alert(
                                'Farmer Details',
                                `Farmer: ${farmer.name}\nCode: ${farmer.code}\nLocation: ${farmer.location}`
                              )
                            }
                          >
                            <Text style={styles.farmerCardBtnText}>View Farmer</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.farmerCardBtn}
                            activeOpacity={0.8}
                            onPress={() => handleNavigateToFarmerTransfer(farmer)}
                          >
                            <Text style={styles.farmerCardBtnText}>Transfer Zone</Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={styles.farmerProfileBtn}
                          activeOpacity={0.8}
                          onPress={() =>
                            Alert.alert('Farmer Profile', `Viewing full profile for ${farmer.name}.`)
                          }
                        >
                          <Text style={styles.farmerProfileBtnText}>View Farmer Profile</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </>
              );
            })()}

            {/* Show More Button */}
            <TouchableOpacity
              style={styles.showMoreBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Load More', 'Loading remaining farmers...')}
            >
              <Text style={styles.showMoreBtnText}>Show more (89 left)</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 10: ZM-10 ASSIGN FARMERS (Steps 1–4 Wizard)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'assign_farmers' && (() => {
          const activeAssignZones = zones.filter((z) => z.status === 'Active');
          const assignZone = activeAssignZones.find((z) => z.id === assignSelectedZoneId) ?? activeAssignZones[0];
          const assignZoneLocations = assignZone
            ? locations.filter((l) => l.zoneId === assignZone.id)
            : [];
          const assignLocation =
            assignZoneLocations.find((l) => l.id === assignSelectedLocationId) ?? assignZoneLocations[0];
          const queryLower = assignFarmerSearch.trim().toLowerCase();
          const filteredUnassignedFarmers = unassignedFarmers.filter((f) => {
            if (!queryLower) return true;
            return (
              f.name.toLowerCase().includes(queryLower) ||
              f.code.toLowerCase().includes(queryLower) ||
              f.registeredLocation.toLowerCase().includes(queryLower)
            );
          });
          const selectedAssignFarmers = unassignedFarmers.filter((f) =>
            assignSelectedFarmerIds.includes(f.id)
          );
          const stepTitles: Record<1 | 2 | 3 | 4, string> = {
            1: 'Select zone',
            2: 'Select location',
            3: 'Select farmers',
            4: 'Review assignment',
          };

          const toggleAssignFarmer = (farmerId: string) => {
            setAssignSelectedFarmerIds((prev) =>
              prev.includes(farmerId) ? prev.filter((id) => id !== farmerId) : [...prev, farmerId]
            );
          };

          return (
            <>
              {/* Step Progress Card */}
              <View style={styles.assignStepperCard}>
                <View style={styles.assignStepperTopRow}>
                  <View style={styles.assignStepPill}>
                    <Text style={styles.assignStepPillText}>Step {assignStep} of 4</Text>
                  </View>
                  <Text style={styles.assignStepNameText}>{stepTitles[assignStep]}</Text>
                </View>

                <View style={styles.assignProgressRow}>
                  {([1, 2, 3, 4] as const).map((stepNum) => (
                    <View
                      key={stepNum}
                      style={[
                        styles.assignProgressSegment,
                        stepNum <= assignStep && styles.assignProgressSegmentActive,
                      ]}
                    />
                  ))}
                </View>

                {assignStep >= 2 && assignZone && (
                  <View style={styles.assignBreadcrumbRow}>
                    <TouchableOpacity
                      style={styles.assignBreadcrumbChip}
                      activeOpacity={0.75}
                      onPress={() => setAssignStep(1)}
                    >
                      <Text style={styles.assignBreadcrumbLabel}>Zone:</Text>
                      <Text style={styles.assignBreadcrumbVal}>{assignZone.name}</Text>
                    </TouchableOpacity>
                    {assignStep >= 3 && assignLocation && (
                      <>
                        <Text style={styles.assignBreadcrumbArrow}>›</Text>
                        <TouchableOpacity
                          style={styles.assignBreadcrumbChip}
                          activeOpacity={0.75}
                          onPress={() => setAssignStep(2)}
                        >
                          <Text style={styles.assignBreadcrumbLabel}>Location:</Text>
                          <Text style={styles.assignBreadcrumbVal}>{assignLocation.name}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* STEP 1 OF 4: SELECT ZONE */}
              {assignStep === 1 && (
                <>
                  <View style={styles.assignSectionHeaderRow}>
                    <Text style={[styles.sectionHeading, { marginTop: 4, marginBottom: 0 }]}>
                      Select zone
                    </Text>
                    <Text style={styles.assignSectionCount}>
                      {activeAssignZones.length} active zones
                    </Text>
                  </View>

                  {activeAssignZones.map((zone) => {
                    const zoneLocCount = locations.filter((l) => l.zoneId === zone.id).length || zone.locationsCount;
                    const isSelected = assignZone?.id === zone.id;
                    return (
                      <TouchableOpacity
                        key={zone.id}
                        style={[
                          styles.assignChoiceCard,
                          isSelected && styles.assignChoiceCardActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setAssignSelectedZoneId(zone.id);
                          const firstLoc = locations.find((l) => l.zoneId === zone.id);
                          setAssignSelectedLocationId(firstLoc ? firstLoc.id : '');
                          setAssignStep(2);
                        }}
                      >
                        <View style={styles.assignChoiceLeft}>
                          <View style={styles.assignChoiceTitleRow}>
                            <Text style={styles.assignChoiceTitle}>{zone.name}</Text>
                            <View style={styles.assignCodeBadge}>
                              <Text style={styles.assignCodeBadgeText}>{zone.shortCode}</Text>
                            </View>
                          </View>
                          <Text style={styles.assignChoiceSubtitle}>
                            {zoneLocCount} locations · {zone.farmersCount} farmers
                          </Text>
                        </View>
                        <View style={styles.assignChoosePill}>
                          <Text style={styles.assignChoosePillText}>Choose</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.assignBulkSwitchCard}
                    activeOpacity={0.8}
                    onPress={handleNavigateToBulkAssign}
                  >
                    <Text style={styles.assignBulkSwitchText}>
                      → Need bulk assignment? Switch to Bulk Farmer Assignment
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 2 OF 4: SELECT LOCATION */}
              {assignStep === 2 && (
                <>
                  <View style={styles.assignSectionHeaderRow}>
                    <Text style={[styles.sectionHeading, { marginTop: 4, marginBottom: 0 }]}>
                      Select location in {assignZone?.name ?? 'Zone'}
                    </Text>
                    <Text style={styles.assignSectionCount}>
                      {assignZoneLocations.length} locations
                    </Text>
                  </View>

                  {assignZoneLocations.length === 0 ? (
                    <View style={styles.cardContainer}>
                      <Text style={styles.assignEmptyTitle}>No locations in this zone yet</Text>
                      <Text style={styles.assignEmptySubtitle}>
                        Go back and choose another zone, or add a location to this zone first.
                      </Text>
                    </View>
                  ) : (
                    assignZoneLocations.map((loc) => {
                      const isSelected = assignLocation?.id === loc.id;
                      return (
                        <TouchableOpacity
                          key={loc.id}
                          style={[
                            styles.assignChoiceCard,
                            isSelected && styles.assignChoiceCardActive,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => {
                            setAssignSelectedLocationId(loc.id);
                            setAssignStep(3);
                          }}
                        >
                          <View style={styles.assignChoiceLeft}>
                            <View style={styles.assignChoiceTitleRow}>
                              <Text style={styles.assignChoiceTitle}>{loc.name}</Text>
                              {loc.status === 'Inactive' && (
                                <View style={styles.assignPendingPill}>
                                  <Text style={styles.assignPendingPillText}>Inactive</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.assignChoiceSubtitle}>
                              {loc.farmersCount} farmers · {loc.type}
                            </Text>
                          </View>
                          <View style={styles.assignChoosePill}>
                            <Text style={styles.assignChoosePillText}>Choose</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}

                  <View style={{ marginTop: 14, marginBottom: 20 }}>
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      activeOpacity={0.8}
                      onPress={() => setAssignStep(1)}
                    >
                      <Text style={styles.secondaryActionText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* STEP 3 OF 4: SELECT FARMERS */}
              {assignStep === 3 && (
                <>
                  <Text style={[styles.sectionHeading, { marginTop: 4, marginBottom: 10 }]}>
                    Select farmers for {assignLocation?.name ?? 'Location'}
                  </Text>

                  {/* Search & Quick Action Card */}
                  <View style={styles.cardContainer}>
                    <Text style={styles.assignSearchLabel}>Search existing farmers</Text>
                    <View style={styles.assignSearchInputWrap}>
                      <SearchIcon />
                      <TextInput
                        style={styles.assignSearchInput}
                        placeholder="Name, ID or registered location"
                        placeholderTextColor={adminColors.placeholder}
                        value={assignFarmerSearch}
                        onChangeText={setAssignFarmerSearch}
                      />
                      {assignFarmerSearch.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setAssignFarmerSearch('')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.assignSearchClear}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={[styles.actionRow, { marginTop: 12 }]}>
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        activeOpacity={0.8}
                        onPress={() => {
                          const shownIds = filteredUnassignedFarmers.map((f) => f.id);
                          setAssignSelectedFarmerIds((prev) =>
                            Array.from(new Set([...prev, ...shownIds]))
                          );
                        }}
                      >
                        <Text style={styles.secondaryActionText}>Select all shown</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        activeOpacity={0.8}
                        onPress={() => setAssignSelectedFarmerIds([])}
                      >
                        <Text style={styles.secondaryActionText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.assignCountRow}>
                    <Text style={styles.assignCountText}>
                      {assignSelectedFarmerIds.length} selected · {filteredUnassignedFarmers.length}{' '}
                      unassigned farmers shown
                    </Text>
                  </View>

                  {filteredUnassignedFarmers.length === 0 ? (
                    <View style={styles.cardContainer}>
                      <Text style={styles.assignEmptyTitle}>No matching unassigned farmers</Text>
                      <Text style={styles.assignEmptySubtitle}>
                        Try clearing your search filter or check Farmer Zone Transfer to move already assigned farmers.
                      </Text>
                    </View>
                  ) : (
                    filteredUnassignedFarmers.map((farmer) => {
                      const isChecked = assignSelectedFarmerIds.includes(farmer.id);
                      const isVerified = farmer.verification === 'Verified';
                      return (
                        <TouchableOpacity
                          key={farmer.id}
                          style={[
                            styles.assignFarmerCard,
                            isChecked && styles.assignFarmerCardSelected,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => toggleAssignFarmer(farmer.id)}
                        >
                          <View
                            style={[
                              styles.assignCheckbox,
                              isChecked && styles.assignCheckboxChecked,
                            ]}
                          >
                            {isChecked && <CheckIcon />}
                          </View>

                          <View style={styles.assignFarmerBody}>
                            <View style={styles.assignFarmerTopRow}>
                              <Text style={styles.assignChoiceTitle}>{farmer.name}</Text>
                              <View
                                style={isVerified ? styles.assignVerifiedPill : styles.assignPendingPill}
                              >
                                <Text
                                  style={
                                    isVerified
                                      ? styles.assignVerifiedPillText
                                      : styles.assignPendingPillText
                                  }
                                >
                                  {farmer.verification}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.assignChoiceSubtitle}>
                              {farmer.code} · registered in {farmer.registeredLocation}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}

                  {/* Step 3 Bottom Actions */}
                  <View style={[styles.actionRow, { marginTop: 14, marginBottom: 20 }]}>
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      activeOpacity={0.8}
                      onPress={() => setAssignStep(2)}
                    >
                      <Text style={styles.secondaryActionText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={
                        assignSelectedFarmerIds.length > 0
                          ? styles.primaryActionButton
                          : styles.disabledActionButton
                      }
                      activeOpacity={0.8}
                      disabled={assignSelectedFarmerIds.length === 0}
                      onPress={() => setAssignStep(4)}
                    >
                      <Text
                        style={
                          assignSelectedFarmerIds.length > 0
                            ? styles.primaryActionText
                            : styles.disabledActionText
                        }
                      >
                        Review ({assignSelectedFarmerIds.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* STEP 4 OF 4: REVIEW & CONFIRM */}
              {assignStep === 4 && (
                <>
                  <Text style={[styles.sectionHeading, { marginTop: 4, marginBottom: 10 }]}>
                    Review assignment
                  </Text>

                  <View style={styles.cardContainer}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Zone</Text>
                      <Text style={styles.reviewValue}>{assignZone?.name ?? '—'}</Text>
                    </View>
                    <View style={styles.dashedDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Location</Text>
                      <Text style={styles.reviewValue}>{assignLocation?.name ?? '—'}</Text>
                    </View>
                    <View style={styles.dashedDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Farmers</Text>
                      <Text style={styles.reviewValue}>{selectedAssignFarmers.length}</Text>
                    </View>
                    <View style={styles.dashedDivider} />

                    <View style={{ marginTop: 10, gap: 8 }}>
                      {selectedAssignFarmers.map((farmer) => {
                        const isVerified = farmer.verification === 'Verified';
                        return (
                          <View key={farmer.id} style={styles.assignReviewFarmerRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.assignReviewFarmerName}>{farmer.name}</Text>
                              <Text style={styles.assignReviewFarmerMeta}>
                                {farmer.code} · registered in {farmer.registeredLocation}
                              </Text>
                            </View>
                            <View
                              style={isVerified ? styles.assignVerifiedPill : styles.assignPendingPill}
                            >
                              <Text
                                style={
                                  isVerified
                                    ? styles.assignVerifiedPillText
                                    : styles.assignPendingPillText
                                }
                              >
                                {farmer.verification}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={{ marginTop: 12, paddingVertical: 6 }}
                      onPress={handleNavigateToBulkAssign}
                    >
                      <Text style={{ ...adminType.caption, color: adminColors.brand, fontWeight: '700' }}>
                        → Need bulk assignment? Switch to Bulk Farmer Assignment
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.actionRow, { marginTop: 14, marginBottom: 20 }]}>
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      activeOpacity={0.8}
                      onPress={() => setAssignStep(3)}
                    >
                      <Text style={styles.secondaryActionText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      activeOpacity={0.8}
                      onPress={handleConfirmFarmerAssignment}
                    >
                      <Text style={styles.primaryActionText}>Confirm Assignment</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 11: ZM-11 BULK FARMER ASSIGNMENT (2-Step Flow)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'bulk_assign' && (() => {
          const activeBulkZones = zones.filter((z) => z.status === 'Active');
          const bulkTargetZone = activeBulkZones.find((z) => z.id === bulkTargetZoneId);
          const bulkTargetLocations = bulkTargetZone
            ? locations.filter((l) => l.zoneId === bulkTargetZone.id)
            : [];
          const bulkTargetLocation = bulkTargetLocations.find((l) => l.id === bulkTargetLocationId);

          const eligibleCatalog: BulkFarmerItem[] = unassignedFarmers.map((f) => ({
            id: f.id,
            name: f.name,
            code: f.code,
            district: 'Nilgiris',
            registeredLocation: f.registeredLocation,
            verification: f.verification,
          }));
          const allBulkFarmers: BulkFarmerItem[] = [...eligibleCatalog, ...bulkExistingFarmers];

          const regLocationOptions = [
            'All',
            ...Array.from(new Set(allBulkFarmers.map((f) => f.registeredLocation))),
          ];

          const bulkQueryLower = bulkSearchQuery.trim().toLowerCase();
          const filteredBulkFarmers = allBulkFarmers.filter((f) => {
            if (bulkQueryLower) {
              const matchesSearch =
                f.name.toLowerCase().includes(bulkQueryLower) ||
                f.code.toLowerCase().includes(bulkQueryLower) ||
                f.registeredLocation.toLowerCase().includes(bulkQueryLower);
              if (!matchesSearch) return false;
            }
            if (bulkDistrictFilter !== 'All' && f.district !== bulkDistrictFilter) return false;
            if (bulkRegLocationFilter !== 'All' && f.registeredLocation !== bulkRegLocationFilter) return false;
            if (bulkVerificationFilter !== 'All' && f.verification !== bulkVerificationFilter) return false;
            return true;
          });

          const eligibleFilteredFarmers = filteredBulkFarmers.filter(
            (f) => !f.assignedZoneName && !f.disabled
          );
          const visibleBulkFarmers = filteredBulkFarmers.slice(0, bulkVisibleLimit);
          const remainingBulkCount = Math.max(0, filteredBulkFarmers.length - visibleBulkFarmers.length);

          const selectedBulkFarmers = allBulkFarmers.filter((f) => bulkSelectedFarmerIds.includes(f.id));
          const eligibleSelected = selectedBulkFarmers.filter((f) => !f.assignedZoneName && !f.disabled);
          const skippedSelected = selectedBulkFarmers.filter((f) => Boolean(f.assignedZoneName) || f.disabled);

          const canPreviewBulk =
            Boolean(bulkTargetZone) && Boolean(bulkTargetLocation) && bulkSelectedFarmerIds.length > 0;

          const toggleBulkFarmer = (id: string) => {
            setBulkSelectedFarmerIds((prev) =>
              prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
          };

          return (
            <>
              {/* Step Progress Card */}
              <View style={styles.assignStepperCard}>
                <View style={styles.assignStepperTopRow}>
                  <View style={styles.assignStepPill}>
                    <Text style={styles.assignStepPillText}>Step {bulkStep} of 2</Text>
                  </View>
                  <Text style={styles.assignStepNameText}>
                    {bulkStep === 1 ? 'Select target & farmers' : 'Preview & confirm'}
                  </Text>
                </View>

                <View style={styles.assignProgressRow}>
                  {([1, 2] as const).map((stepNum) => (
                    <View
                      key={stepNum}
                      style={[
                        styles.assignProgressSegment,
                        stepNum <= bulkStep && styles.assignProgressSegmentActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {bulkStep === 1 ? (
                <>
                  {/* Target Zone & Location Card */}
                  <View style={[styles.cardContainer, { marginBottom: 12 }]}>
                    <Text style={styles.filterFieldLabel}>Target zone</Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      activeOpacity={0.8}
                      onPress={() => {
                        setBulkShowZonePicker((prev) => !prev);
                        setBulkShowLocPicker(false);
                        setBulkOpenFilterDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownVal,
                          !bulkTargetZone && { color: adminColors.placeholder },
                        ]}
                      >
                        {bulkTargetZone ? bulkTargetZone.name : 'Choose a zone'}
                      </Text>
                      <ChevronDownIcon />
                    </TouchableOpacity>

                    {bulkShowZonePicker && (
                      <View style={styles.bulkDropdownMenu}>
                        {activeBulkZones.map((zone) => {
                          const isSelected = zone.id === bulkTargetZoneId;
                          return (
                            <TouchableOpacity
                              key={zone.id}
                              style={[
                                styles.bulkDropdownOption,
                                isSelected && styles.bulkDropdownOptionActive,
                              ]}
                              onPress={() => {
                                setBulkTargetZoneId(zone.id);
                                setBulkTargetLocationId('');
                                setBulkShowZonePicker(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.bulkDropdownOptionText,
                                  isSelected && styles.bulkDropdownOptionTextActive,
                                ]}
                              >
                                {zone.name} ({zone.shortCode})
                              </Text>
                              <Text style={styles.assignSectionCount}>
                                {locations.filter((l) => l.zoneId === zone.id).length} locations
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    <Text style={[styles.filterFieldLabel, { marginTop: 12 }]}>Target location</Text>
                    <TouchableOpacity
                      style={[
                        styles.dropdownBox,
                        !bulkTargetZone && { backgroundColor: adminColors.canvas },
                      ]}
                      activeOpacity={bulkTargetZone ? 0.8 : 1}
                      disabled={!bulkTargetZone}
                      onPress={() => {
                        setBulkShowLocPicker((prev) => !prev);
                        setBulkShowZonePicker(false);
                        setBulkOpenFilterDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownVal,
                          (!bulkTargetZone || !bulkTargetLocation) && { color: adminColors.placeholder },
                        ]}
                      >
                        {bulkTargetLocation ? `${bulkTargetLocation.name} (${bulkTargetLocation.type})` : 'Choose a location'}
                      </Text>
                      <ChevronDownIcon />
                    </TouchableOpacity>

                    {bulkShowLocPicker && bulkTargetZone && (
                      <View style={styles.bulkDropdownMenu}>
                        {bulkTargetLocations.map((loc) => {
                          const isSelected = loc.id === bulkTargetLocationId;
                          return (
                            <TouchableOpacity
                              key={loc.id}
                              style={[
                                styles.bulkDropdownOption,
                                isSelected && styles.bulkDropdownOptionActive,
                              ]}
                              onPress={() => {
                                setBulkTargetLocationId(loc.id);
                                setBulkShowLocPicker(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.bulkDropdownOptionText,
                                  isSelected && styles.bulkDropdownOptionTextActive,
                                ]}
                              >
                                {loc.name}
                              </Text>
                              <Text style={styles.assignSectionCount}>{loc.type}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Find Farmers Card */}
                  <View style={styles.cardContainer}>
                    <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 10 }]}>
                      Find farmers
                    </Text>

                    <Text style={styles.filterFieldLabel}>Search</Text>
                    <View style={styles.assignSearchInputWrap}>
                      <SearchIcon />
                      <TextInput
                        style={styles.assignSearchInput}
                        placeholder="Name or farmer ID"
                        placeholderTextColor={adminColors.placeholder}
                        value={bulkSearchQuery}
                        onChangeText={(text) => {
                          setBulkSearchQuery(text);
                          setBulkVisibleLimit(10);
                        }}
                      />
                      {bulkSearchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setBulkSearchQuery('')}>
                          <Text style={styles.assignSearchClear}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={[styles.filterDropdownRow, { marginTop: 12, marginBottom: 0 }]}>
                      <View style={styles.filterDropdownCol}>
                        <Text style={styles.filterFieldLabel}>District</Text>
                        <TouchableOpacity
                          style={styles.dropdownBox}
                          onPress={() =>
                            setBulkOpenFilterDropdown((prev) =>
                              prev === 'district' ? null : 'district'
                            )
                          }
                        >
                          <Text style={styles.dropdownVal}>{bulkDistrictFilter}</Text>
                          <ChevronDownIcon />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.filterDropdownCol}>
                        <Text style={styles.filterFieldLabel}>Registered location</Text>
                        <TouchableOpacity
                          style={styles.dropdownBox}
                          onPress={() =>
                            setBulkOpenFilterDropdown((prev) =>
                              prev === 'location' ? null : 'location'
                            )
                          }
                        >
                          <Text style={styles.dropdownVal} numberOfLines={1}>
                            {bulkRegLocationFilter}
                          </Text>
                          <ChevronDownIcon />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {bulkOpenFilterDropdown === 'district' && (
                      <View style={styles.bulkDropdownMenu}>
                        {(['All', 'Nilgiris'] as const).map((dist) => (
                          <TouchableOpacity
                            key={dist}
                            style={[
                              styles.bulkDropdownOption,
                              bulkDistrictFilter === dist && styles.bulkDropdownOptionActive,
                            ]}
                            onPress={() => {
                              setBulkDistrictFilter(dist);
                              setBulkOpenFilterDropdown(null);
                            }}
                          >
                            <Text
                              style={[
                                styles.bulkDropdownOptionText,
                                bulkDistrictFilter === dist && styles.bulkDropdownOptionTextActive,
                              ]}
                            >
                              {dist}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {bulkOpenFilterDropdown === 'location' && (
                      <View style={styles.bulkDropdownMenu}>
                        {regLocationOptions.map((locName) => (
                          <TouchableOpacity
                            key={locName}
                            style={[
                              styles.bulkDropdownOption,
                              bulkRegLocationFilter === locName && styles.bulkDropdownOptionActive,
                            ]}
                            onPress={() => {
                              setBulkRegLocationFilter(locName);
                              setBulkOpenFilterDropdown(null);
                              setBulkVisibleLimit(10);
                            }}
                          >
                            <Text
                              style={[
                                styles.bulkDropdownOptionText,
                                bulkRegLocationFilter === locName && styles.bulkDropdownOptionTextActive,
                              ]}
                            >
                              {locName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <Text style={[styles.filterFieldLabel, { marginTop: 12 }]}>Verification</Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() =>
                        setBulkOpenFilterDropdown((prev) =>
                          prev === 'verification' ? null : 'verification'
                        )
                      }
                    >
                      <Text style={styles.dropdownVal}>{bulkVerificationFilter}</Text>
                      <ChevronDownIcon />
                    </TouchableOpacity>

                    {bulkOpenFilterDropdown === 'verification' && (
                      <View style={styles.bulkDropdownMenu}>
                        {(['All', 'Verified', 'Pending'] as const).map((ver) => (
                          <TouchableOpacity
                            key={ver}
                            style={[
                              styles.bulkDropdownOption,
                              bulkVerificationFilter === ver && styles.bulkDropdownOptionActive,
                            ]}
                            onPress={() => {
                              setBulkVerificationFilter(ver);
                              setBulkOpenFilterDropdown(null);
                              setBulkVisibleLimit(10);
                            }}
                          >
                            <Text
                              style={[
                                styles.bulkDropdownOptionText,
                                bulkVerificationFilter === ver && styles.bulkDropdownOptionTextActive,
                              ]}
                            >
                              {ver}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <View style={[styles.actionRow, { marginTop: 14 }]}>
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        activeOpacity={0.8}
                        onPress={() => {
                          const eligibleIds = eligibleFilteredFarmers.map((f) => f.id);
                          setBulkSelectedFarmerIds((prev) =>
                            Array.from(new Set([...prev, ...eligibleIds]))
                          );
                        }}
                      >
                        <Text style={styles.secondaryActionText}>
                          Select all eligible ({eligibleFilteredFarmers.length})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        activeOpacity={0.8}
                        onPress={() => setBulkSelectedFarmerIds([])}
                      >
                        <Text style={styles.secondaryActionText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Match Count */}
                  <View style={styles.assignCountRow}>
                    <Text style={styles.assignCountText}>
                      <Text style={{ color: adminColors.ink, fontWeight: '800' }}>
                        {bulkSelectedFarmerIds.length}
                      </Text>{' '}
                      selected · {filteredBulkFarmers.length} farmers match
                    </Text>
                  </View>

                  {/* Farmers Checklist */}
                  {visibleBulkFarmers.map((farmer) => {
                    const isChecked = bulkSelectedFarmerIds.includes(farmer.id);
                    const isVerified = farmer.verification === 'Verified';
                    return (
                      <TouchableOpacity
                        key={farmer.id}
                        style={[
                          styles.assignFarmerCard,
                          isChecked && styles.assignFarmerCardSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleBulkFarmer(farmer.id)}
                      >
                        <View
                          style={[
                            styles.assignCheckbox,
                            isChecked && styles.assignCheckboxChecked,
                          ]}
                        >
                          {isChecked && <CheckIcon />}
                        </View>

                        <View style={styles.assignFarmerBody}>
                          <View style={styles.assignFarmerTopRow}>
                            <Text style={styles.assignChoiceTitle}>{farmer.name}</Text>
                            <View
                              style={isVerified ? styles.assignVerifiedPill : styles.assignPendingPill}
                            >
                              <Text
                                style={
                                  isVerified
                                    ? styles.assignVerifiedPillText
                                    : styles.assignPendingPillText
                                }
                              >
                                {farmer.verification}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.assignChoiceSubtitle}>
                            {farmer.code} · registered in {farmer.registeredLocation}
                          </Text>

                          <View style={styles.bulkStatusPillWrap}>
                            {farmer.disabled ? (
                              <View style={styles.bulkDisabledPill}>
                                <Text style={styles.bulkDisabledPillText}>
                                  Farmer account is disabled
                                </Text>
                              </View>
                            ) : farmer.assignedZoneName ? (
                              <View style={styles.bulkAssignedWarnPill}>
                                <Text style={styles.bulkAssignedWarnPillText}>
                                  Already assigned to {farmer.assignedZoneName}
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.assignVerifiedPill}>
                                <Text style={styles.assignVerifiedPillText}>
                                  Eligible · Unassigned
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {remainingBulkCount > 0 && (
                    <TouchableOpacity
                      style={[styles.showMoreBtn, { marginTop: 2 }]}
                      activeOpacity={0.8}
                      onPress={() => setBulkVisibleLimit((prev) => prev + 10)}
                    >
                      <Text style={styles.showMoreBtnText}>
                        Show more ({remainingBulkCount} left)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Bottom Step 1 Actions */}
                  <View style={[styles.actionRow, { marginTop: 8 }]}>
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      activeOpacity={0.8}
                      onPress={() => setCurrentView('assign_farmers')}
                    >
                      <Text style={styles.secondaryActionText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={canPreviewBulk ? styles.primaryActionButton : styles.disabledActionButton}
                      activeOpacity={0.8}
                      disabled={!canPreviewBulk}
                      onPress={() => setBulkStep(2)}
                    >
                      <Text
                        style={
                          canPreviewBulk ? styles.primaryActionText : styles.disabledActionText
                        }
                      >
                        Preview Assignment
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!canPreviewBulk && (
                    <Text style={styles.bulkHelperCaption}>
                      Choose a target zone, target location, and at least one farmer first.
                    </Text>
                  )}
                </>
              ) : (
                <>
                  {/* Preview Assignment Card (Step 2 of 2) */}
                  <View style={styles.cardContainer}>
                    <Text style={[styles.sectionHeading, { marginTop: 0, marginBottom: 10 }]}>
                      Preview assignment
                    </Text>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Target</Text>
                      <Text style={styles.reviewValue}>
                        {bulkTargetZone?.name ?? '—'} / {bulkTargetLocation?.name ?? '—'}
                      </Text>
                    </View>
                    <View style={styles.dashedDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Will be assigned</Text>
                      <Text style={[styles.reviewValue, { color: adminColors.success.text }]}>
                        {eligibleSelected.length}
                      </Text>
                    </View>
                    <View style={styles.dashedDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Will be skipped</Text>
                      <Text
                        style={[
                          styles.reviewValue,
                          skippedSelected.length > 0 && { color: adminColors.warning.text },
                        ]}
                      >
                        {skippedSelected.length}
                      </Text>
                    </View>

                    {skippedSelected.length > 0 && (
                      <>
                        <View style={styles.dashedDivider} />
                        <View style={styles.dashedAlertBox}>
                          {skippedSelected.slice(0, 4).map((f) => (
                            <Text key={f.id} style={styles.dashedAlertItem}>
                              {f.code}:{' '}
                              {f.disabled
                                ? 'Farmer account is disabled'
                                : `Already assigned to ${f.assignedZoneName}`}
                            </Text>
                          ))}
                          {skippedSelected.length > 4 && (
                            <Text style={[styles.dashedAlertItem, { color: adminColors.muted, marginBottom: 0 }]}>
                              and {skippedSelected.length - 4} more
                            </Text>
                          )}
                        </View>
                      </>
                    )}
                  </View>

                  <View style={[styles.actionRow, { marginTop: 14, marginBottom: 20 }]}>
                    <TouchableOpacity
                      style={styles.secondaryActionButton}
                      activeOpacity={0.8}
                      onPress={() => setBulkStep(1)}
                    >
                      <Text style={styles.secondaryActionText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={
                        eligibleSelected.length > 0
                          ? styles.primaryActionButton
                          : styles.disabledActionButton
                      }
                      activeOpacity={0.8}
                      disabled={eligibleSelected.length === 0}
                      onPress={handleConfirmBulkAssignment}
                    >
                      <Text
                        style={
                          eligibleSelected.length > 0
                            ? styles.primaryActionText
                            : styles.disabledActionText
                        }
                      >
                        Confirm Bulk Assignment
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 11B: ASSIGNED FARMERS CONFIRMATION (From Assign / Bulk Assign)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'assigned_farmers' && lastAssignmentResult && (
          <>
            <View style={styles.assignSuccessHeroCard}>
              <View style={styles.assignSuccessHeaderRow}>
                <View style={styles.assignSuccessIconCircle}>
                  <CheckIcon color={adminColors.success.text} />
                </View>
                <View style={styles.assignSuccessTitleWrap}>
                  <Text style={styles.assignSuccessTitle}>Assignment Confirmed</Text>
                  <Text style={styles.assignSuccessSubtitle}>
                    {lastAssignmentResult.assignedFarmers.length}{' '}
                    {lastAssignmentResult.assignedFarmers.length === 1 ? 'farmer' : 'farmers'}{' '}
                    assigned to {lastAssignmentResult.zoneName} · {lastAssignmentResult.locationName}
                  </Text>
                </View>
                <View style={styles.assignSuccessSourcePill}>
                  <Text style={styles.assignSuccessSourceText}>{lastAssignmentResult.source}</Text>
                </View>
              </View>

              <View style={styles.dashedDivider} />

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Zone</Text>
                <Text style={styles.reviewValue}>{lastAssignmentResult.zoneName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Location</Text>
                <Text style={styles.reviewValue}>
                  {lastAssignmentResult.locationName} ({lastAssignmentResult.locationType})
                </Text>
              </View>
              <View
                style={[
                  styles.reviewRow,
                  lastAssignmentResult.skippedCount === 0 && { borderBottomWidth: 0, paddingBottom: 0 },
                ]}
              >
                <Text style={styles.reviewLabel}>Assigned Farmers</Text>
                <Text style={[styles.reviewValue, { color: adminColors.success.text }]}>
                  {lastAssignmentResult.assignedFarmers.length}
                </Text>
              </View>
              {lastAssignmentResult.skippedCount > 0 && (
                <View style={[styles.reviewRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.reviewLabel}>Skipped</Text>
                  <Text style={[styles.reviewValue, { color: adminColors.warning.text }]}>
                    {lastAssignmentResult.skippedCount}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionHeading}>
              Assigned farmers ({lastAssignmentResult.assignedFarmers.length})
            </Text>

            {lastAssignmentResult.assignedFarmers.length === 0 ? (
              <View style={styles.cardContainer}>
                <Text style={styles.farmerMetaText}>No farmers were assigned.</Text>
              </View>
            ) : (
              lastAssignmentResult.assignedFarmers.map((farmer) => (
                <View key={farmer.id} style={styles.farmerCard}>
                  <View style={styles.farmerCardHeader}>
                    <Text style={styles.farmerName}>{farmer.name}</Text>
                    <View style={styles.farmerBadgeRow}>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{farmer.status}</Text>
                      </View>
                      <View
                        style={
                          farmer.verification === 'Verified'
                            ? styles.verifiedBadge
                            : styles.pendingBadge
                        }
                      >
                        <Text
                          style={
                            farmer.verification === 'Verified'
                              ? styles.verifiedBadgeText
                              : styles.pendingBadgeText
                          }
                        >
                          {farmer.verification}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.farmerCodeLoc}>
                    {farmer.code} · {farmer.location}
                  </Text>
                  <Text style={styles.farmerMetaText}>
                    {farmer.phone} · {farmer.farmingType} · {farmer.acres} acres
                  </Text>

                  <View style={styles.farmerCardBtnRow}>
                    <TouchableOpacity
                      style={styles.farmerCardBtn}
                      activeOpacity={0.8}
                      onPress={() => handleNavigateToFarmerTransfer(farmer)}
                    >
                      <Text style={styles.farmerCardBtnText}>Transfer Zone</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              style={[styles.secondaryActionButton, { width: '100%', marginTop: 6 }]}
              activeOpacity={0.8}
              onPress={() => {
                setFarmerSelectedZone(lastAssignmentResult.zoneLabel);
                setFarmerSearchQuery('');
                setCurrentView('farmer_list');
              }}
            >
              <Text style={styles.secondaryActionText}>
                View All Farmers in {lastAssignmentResult.zoneName}
              </Text>
            </TouchableOpacity>

            <View style={[styles.actionRow, { marginTop: 10, marginBottom: 20 }]}>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                activeOpacity={0.8}
                onPress={() => handleNavigateToAssignFarmers('dashboard')}
              >
                <Text style={styles.secondaryActionText}>Assign More</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.8}
                onPress={() => setCurrentView('dashboard')}
              >
                <Text style={styles.primaryActionText}>Done</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 12: ZM-12 FARMER ZONE TRANSFER (Image 5 middle)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'farmer_transfer' && (
          <>
            {/* Find a Farmer Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.filterFieldLabel}>Find a farmer</Text>
              <TextInput
                style={styles.formInput}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={transferSearchFarmer}
                onChangeText={setTransferSearchFarmer}
              />
              <TouchableOpacity
                style={[styles.secondaryActionButton, { width: '100%', marginTop: 8 }]}
                activeOpacity={0.8}
                onPress={() => Alert.alert('Search Farmer', 'Searching farmer records...')}
              >
                <Text style={styles.secondaryActionText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Review Transfer Card */}
            <View style={styles.cardContainer}>
              <Text style={[styles.sectionHeading, { marginBottom: 10 }]}>Review transfer</Text>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Farmer</Text>
                <Text style={styles.reviewValue}>
                  {transferSelectedFarmer.name} ({transferSelectedFarmer.code})
                </Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Current zone / location</Text>
                <Text style={styles.reviewValue}>
                  Ooty Zone / {transferSelectedFarmer.location}
                </Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>New zone</Text>
                <Text style={styles.reviewValue}>{transferNewZone}</Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>New location</Text>
                <Text style={styles.reviewValue}>{transferNewLocation}</Text>
              </View>
              <View style={styles.dashedDivider} />

              <Text style={[styles.inputLabelRequired, { marginTop: 12 }]}>
                Reason for transfer *
              </Text>
              <TextInput
                style={[styles.formInput, { height: 75, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={3}
                placeholder=""
                placeholderTextColor={adminColors.muted}
                value={transferReason}
                onChangeText={setTransferReason}
              />
              <Text style={styles.inputHelperText}>At least 5 characters.</Text>
            </View>

            {/* Action Buttons */}
            <View style={[styles.actionRow, { marginTop: 14, marginBottom: 20 }]}>
              <TouchableOpacity
                style={styles.secondaryActionButton}
                activeOpacity={0.8}
                onPress={() => setCurrentView('farmer_list')}
              >
                <Text style={styles.secondaryActionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryActionButton}
                activeOpacity={0.8}
                onPress={() => {
                  setRecentTransfers((prev) => [
                    {
                      id: `TR-00${prev.length + 14}`,
                      text: `${transferSelectedFarmer.name}: Ooty Zone to ${transferNewZone} — 2026-10-15`,
                    },
                    ...prev,
                  ]);
                  Alert.alert(
                    'Transfer Confirmed',
                    `${transferSelectedFarmer.name} transferred to ${transferNewZone} / ${transferNewLocation}.`
                  );
                  setCurrentView('farmer_list');
                }}
              >
                <Text style={styles.primaryActionText}>Confirm Transfer</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Transfers Section */}
            <Text style={styles.sectionHeading}>Recent transfers</Text>
            <View style={[styles.cardContainer, { marginBottom: 20 }]}>
              {recentTransfers.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <View style={styles.recentTransferRow}>
                    <Text style={styles.recentTransferCode}>{item.id}</Text>
                    <Text style={styles.recentTransferText}>{item.text}</Text>
                  </View>
                  {idx < recentTransfers.length - 1 && <View style={styles.dashedDivider} />}
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 13: ZM-13 ZONE WAREHOUSE MAPPING (Image 5 right)
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'warehouse_mapping' && (
          <>
            {/* Zone Selector Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.filterFieldLabel}>Zone</Text>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => {
                  const idx = zones.findIndex((z) => `${z.name} (${z.shortCode})` === warehouseSelectedZone);
                  const nextIdx = (idx + 1) % zones.length;
                  const nextZone = zones[nextIdx];
                  if (nextZone) {
                    setWarehouseSelectedZone(`${nextZone.name} (${nextZone.shortCode})`);
                  }
                }}
              >
                <Text style={styles.dropdownVal}>{warehouseSelectedZone}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>

            {/* Warehouse Mapping Cards */}
            {warehouseMappings.map((wh) => (
              <View key={wh.id} style={styles.warehouseCard}>
                <View style={styles.warehouseCardHeader}>
                  <Text style={styles.warehouseName}>{wh.name}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{wh.status}</Text>
                  </View>
                </View>
                <Text style={styles.warehouseSubtitle}>
                  {wh.code} · {wh.type} · since {wh.sinceDate}
                </Text>
                <TouchableOpacity
                  style={styles.turnOffMappingBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    Alert.alert(
                      'Turn off mapping',
                      `Are you sure you want to turn off mapping for ${wh.name}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Turn Off',
                          style: 'destructive',
                          onPress: () => {
                            setWarehouseMappings((prev) =>
                              prev.filter((item) => item.id !== wh.id)
                            );
                            Alert.alert('Mapping Removed', `Mapping for ${wh.name} has been turned off.`);
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.turnOffMappingText}>Turn off mapping</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Mapping Button */}
            <TouchableOpacity
              style={styles.addMappingBtn}
              activeOpacity={0.8}
              onPress={() => {
                const nextId = `wh-map-${warehouseMappings.length + 1}`;
                const newMapping: ZoneWarehouseMappingData = {
                  id: nextId,
                  code: 'WH-KOTA',
                  name: 'Kotagiri Sub-Warehouse',
                  type: 'Sub warehouse',
                  sinceDate: '2026-10-15',
                  status: 'Active',
                  isMapped: true,
                };
                setWarehouseMappings((prev) => [...prev, newMapping]);
                Alert.alert('Mapping Added', 'Kotagiri Sub-Warehouse added to zone mapping.');
              }}
            >
              <Text style={styles.addMappingBtnText}>Add Mapping</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 14: ZM-14 / SA-M18-S14 ZONE-WISE REPORTS
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'zone_reports' && (
          <>
            {/* Filter Card */}
            <View style={styles.reportFilterCard}>
              {/* Date from & Date to Row */}
              <View style={styles.filterInputRow}>
                <View style={styles.filterInputCol}>
                  <Text style={styles.filterInputLabel}>
                    Date from <Text style={styles.optionalMutedText}>Optional</Text>
                  </Text>
                  <TextInput
                    style={styles.filterTextInput}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={adminColors.placeholder}
                    value={reportDateFrom}
                    onChangeText={setReportDateFrom}
                  />
                </View>
                <View style={styles.filterInputCol}>
                  <Text style={styles.filterInputLabel}>
                    Date to <Text style={styles.optionalMutedText}>Optional</Text>
                  </Text>
                  <TextInput
                    style={styles.filterTextInput}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={adminColors.placeholder}
                    value={reportDateTo}
                    onChangeText={setReportDateTo}
                  />
                </View>
              </View>

              {/* Zone Selector */}
              <View style={styles.filterFieldSpacing}>
                <Text style={styles.filterInputLabel}>Zone</Text>
                <TouchableOpacity
                  style={styles.reportDropdownSelector}
                  activeOpacity={0.8}
                  onPress={() => setShowReportZoneDropdown((prev) => !prev)}
                >
                  <Text style={styles.reportDropdownSelectorText}>{reportZone}</Text>
                  <ChevronDownIcon color={adminColors.muted} />
                </TouchableOpacity>
                {showReportZoneDropdown && (
                  <View style={styles.inlineDropdownList}>
                    {['All zones', 'Ooty Zone', 'Coonoor Zone', 'Kotagiri Zone', 'Gudalur Zone', 'Kundah Zone'].map((zName) => (
                      <TouchableOpacity
                        key={zName}
                        style={[
                          styles.inlineDropdownItem,
                          reportZone === zName && styles.inlineDropdownItemActive,
                        ]}
                        onPress={() => {
                          setReportZone(zName);
                          setShowReportZoneDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.inlineDropdownItemText,
                            reportZone === zName && styles.inlineDropdownItemTextActive,
                          ]}
                        >
                          {zName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Farmer Status & Farming Type Row */}
              <View style={styles.filterInputRow}>
                <View style={styles.filterInputCol}>
                  <Text style={styles.filterInputLabel}>Farmer status</Text>
                  <TouchableOpacity
                    style={styles.reportDropdownSelector}
                    activeOpacity={0.8}
                    onPress={() => setShowReportStatusDropdown((prev) => !prev)}
                  >
                    <Text style={styles.reportDropdownSelectorText}>{reportFarmerStatus}</Text>
                    <ChevronDownIcon color={adminColors.muted} />
                  </TouchableOpacity>
                  {showReportStatusDropdown && (
                    <View style={styles.inlineDropdownList}>
                      {['All', 'Active', 'Inactive'].map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.inlineDropdownItem,
                            reportFarmerStatus === st && styles.inlineDropdownItemActive,
                          ]}
                          onPress={() => {
                            setReportFarmerStatus(st);
                            setShowReportStatusDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.inlineDropdownItemText,
                              reportFarmerStatus === st && styles.inlineDropdownItemTextActive,
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.filterInputCol}>
                  <Text style={styles.filterInputLabel}>Farming type</Text>
                  <TouchableOpacity
                    style={styles.reportDropdownSelector}
                    activeOpacity={0.8}
                    onPress={() => setShowReportTypeDropdown((prev) => !prev)}
                  >
                    <Text style={styles.reportDropdownSelectorText}>{reportFarmingType}</Text>
                    <ChevronDownIcon color={adminColors.muted} />
                  </TouchableOpacity>
                  {showReportTypeDropdown && (
                    <View style={styles.inlineDropdownList}>
                      {['All', 'Organic', 'Natural', 'Biodynamic'].map((ft) => (
                        <TouchableOpacity
                          key={ft}
                          style={[
                            styles.inlineDropdownItem,
                            reportFarmingType === ft && styles.inlineDropdownItemActive,
                          ]}
                          onPress={() => {
                            setReportFarmingType(ft);
                            setShowReportTypeDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.inlineDropdownItemText,
                              reportFarmingType === ft && styles.inlineDropdownItemTextActive,
                            ]}
                          >
                            {ft}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Export Report Button */}
              <TouchableOpacity
                style={styles.reportExportBtn}
                activeOpacity={0.8}
                onPress={handleExportReport}
              >
                <Text style={styles.reportExportBtnText}>Export Report</Text>
              </TouchableOpacity>
            </View>

            {/* Section 1: Farmers by zone (incl. no zone) */}
            <View style={styles.reportSectionHeader}>
              <Text style={styles.reportSectionTitle}>Farmers by zone (incl. no zone)</Text>
            </View>
            <View style={styles.reportCard}>
              {[
                { name: 'Ooty Zone', count: 92, percent: '100%' },
                { name: 'Coonoor Zone', count: 64, percent: '69.5%' },
                { name: 'Kotagiri Zone', count: 41, percent: '44.5%' },
                { name: 'Gudalur Zone', count: 29, percent: '31.5%' },
                { name: 'Kundah Zone', count: 22, percent: '23.9%' },
                { name: 'No zone', count: 12, percent: '13%' },
              ].map((item, idx) => (
                <View
                  key={item.name}
                  style={[
                    styles.reportBarItem,
                    idx === 5 && { marginBottom: 0 },
                  ]}
                >
                  <View style={styles.reportBarHeader}>
                    <Text style={styles.reportBarLabel}>{item.name}</Text>
                    <Text style={styles.reportBarCount}>{item.count}</Text>
                  </View>
                  <View style={styles.reportProgressTrack}>
                    <View style={[styles.reportProgressFill, { width: item.percent as DimensionValue }]} />
                  </View>
                </View>
              ))}
            </View>

            {/* Section 2: Active vs inactive farmers */}
            <View style={styles.reportSectionHeader}>
              <Text style={styles.reportSectionTitle}>Active vs inactive farmers</Text>
            </View>
            <View style={styles.reportCard}>
              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Active</Text>
                <Text style={styles.reportMetricValue}>245</Text>
              </View>
              <View style={styles.reportDashedDivider} />
              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Inactive</Text>
                <Text style={styles.reportMetricValue}>15</Text>
              </View>
            </View>

            {/* Section 3: Verified vs pending */}
            <View style={styles.reportSectionHeader}>
              <Text style={styles.reportSectionTitle}>Verified vs pending</Text>
            </View>
            <View style={styles.reportCard}>
              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Verified</Text>
                <Text style={styles.reportMetricValue}>192</Text>
              </View>
              <View style={styles.reportDashedDivider} />
              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Pending</Text>
                <Text style={styles.reportMetricValue}>68</Text>
              </View>
            </View>

            {/* Section 4: Farming type */}
            <View style={styles.reportSectionHeader}>
              <Text style={styles.reportSectionTitle}>Farming type</Text>
            </View>
            <View style={styles.reportCard}>
              {[
                { name: 'Organic', count: 158, percent: '100%' },
                { name: 'Natural', count: 72, percent: '45.5%' },
                { name: 'Biodynamic', count: 30, percent: '19%' },
              ].map((item, idx) => (
                <View
                  key={item.name}
                  style={[
                    styles.reportBarItem,
                    idx === 2 && { marginBottom: 0 },
                  ]}
                >
                  <View style={styles.reportBarHeader}>
                    <Text style={styles.reportBarLabel}>{item.name}</Text>
                    <Text style={styles.reportBarCount}>{item.count}</Text>
                  </View>
                  <View style={styles.reportProgressTrack}>
                    <View style={[styles.reportProgressFill, { width: item.percent as DimensionValue }]} />
                  </View>
                </View>
              ))}
            </View>

            {/* Section 5: Farm area & warehouse allocation */}
            <View style={styles.reportSectionHeader}>
              <Text style={styles.reportSectionTitle}>Farm area & warehouse allocation</Text>
            </View>
            <View style={styles.reportCard}>
              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Total farm area</Text>
                <Text style={styles.reportMetricValue}>612.8 acres</Text>
              </View>
              <View style={styles.reportDashedDivider} />
              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Warehouses mapped</Text>
                <Text style={styles.reportMetricValue}>5 of 5 active zones</Text>
              </View>
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VIEW 15: ZM-15 / SA-M18-S15 ZONE STATUS & DEACTIVATION
        ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'zone_status_deactivation' && (
          <>
            {/* Zone Identity Card */}
            <View style={styles.zoneIdentityCard}>
              <View style={styles.zoneIdentityHeader}>
                <Text style={styles.zoneIdentityTitle}>{deactivationZone.name}</Text>
                <View
                  style={
                    deactivationZone.status === 'Active'
                      ? styles.zoneStatusBadgeActive
                      : styles.zoneStatusBadgeInactive
                  }
                >
                  <Text
                    style={
                      deactivationZone.status === 'Active'
                        ? styles.zoneStatusBadgeActiveText
                        : styles.zoneStatusBadgeInactiveText
                    }
                  >
                    {deactivationZone.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.zoneIdentitySubtitle}>
                {deactivationZone.code} · Code {deactivationZone.shortCode}
              </Text>
            </View>

            {/* Dependencies Section */}
            <View style={styles.reportSectionHeader}>
              <Text style={styles.reportSectionTitle}>Dependencies</Text>
            </View>
            <View style={styles.reportCard}>
              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Farmers assigned</Text>
                <Text style={styles.reportMetricValue}>
                  {deactivationZone.farmersCount}{' '}
                  <Text style={styles.reportMetricSubValue}>
                    {deactivationZone.status === 'Inactive'
                      ? '(frozen — no new assignments)'
                      : '(active assignments)'}
                  </Text>
                </Text>
              </View>
              <View style={styles.reportDashedDivider} />

              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Locations</Text>
                <Text style={styles.reportMetricValue}>{deactivationZone.locationsCount}</Text>
              </View>
              <View style={styles.reportDashedDivider} />

              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Active warehouse mappings</Text>
                <Text style={styles.reportMetricValue}>{deactivationZone.warehousesCount}</Text>
              </View>
              <View style={styles.reportDashedDivider} />

              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Zone manager</Text>
                <Text style={styles.reportMetricValue}>
                  {deactivationZone.manager === 'None' ? 'Not assigned' : deactivationZone.manager}
                </Text>
              </View>
              <View style={styles.reportDashedDivider} />

              <View style={styles.reportMetricRow}>
                <Text style={styles.reportMetricLabel}>Pending operations</Text>
                <Text style={styles.reportMetricValue}>0</Text>
              </View>
            </View>

            {/* Warning Callout Box */}
            <View style={styles.deactivationWarningCard}>
              <Text style={styles.deactivationWarningText}>
                {deactivationZone.farmersCount > 0
                  ? `${deactivationZone.farmersCount} farmers are kept assigned and frozen in this inactive zone. Archiving requires transferring them first.`
                  : 'No farmers are assigned to this zone. Archiving can proceed once confirmed.'}
              </Text>
            </View>

            {/* Reason Field */}
            <View style={styles.deactivationReasonWrap}>
              <Text style={styles.reasonLabel}>
                Reason <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.reasonInput}
                multiline
                numberOfLines={3}
                placeholder="Enter reason for status change..."
                placeholderTextColor={adminColors.placeholder}
                value={deactivationReason}
                onChangeText={setDeactivationReason}
              />
              <Text style={styles.reasonHelperText}>
                At least 5 characters, recorded in the activity log.
              </Text>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.deactivationButtonsRow}>
              <TouchableOpacity
                style={styles.reactivateSolidBtn}
                activeOpacity={0.8}
                onPress={handleReactivateZone}
              >
                <Text style={styles.reactivateSolidBtnText}>Reactivate Zone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.archiveOutlineBtn}
                activeOpacity={0.8}
                onPress={handleArchiveZone}
              >
                <Text style={styles.archiveOutlineBtnText}>Archive Zone</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.85,
    fontSize: 12,
    marginTop: 1,
  },
  headerBadge: {
    backgroundColor: adminOverlay.whitePill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: adminRadius.sm,
  },
  headerBadgeText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: 24,
  },
  actionButtonsGrid: {
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  primaryActionText: {
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 13.5,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  secondaryActionText: {
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 13.5,
  },
  sectionWrap: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  distRow: {
    marginBottom: 14,
  },
  distTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  distZoneLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  distZoneValue: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brand,
  },
  whRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
  },
  whZoneLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12.5,
  },
  whZoneVal: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '700',
  },
  dashedDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 1,
  },
  recentZoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  recentZoneLeft: {
    flex: 1,
  },
  recentZoneName: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '700',
  },
  recentZoneMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.sm,
  },
  activeBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontSize: 10.5,
    fontWeight: '800',
  },
  inactiveBadge: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.sm,
  },
  inactiveBadgeText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10.5,
    fontWeight: '800',
  },
  attentionBlock: {
    paddingVertical: 9,
  },
  attentionTitle: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  attentionDesc: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    lineHeight: 16.5,
  },
  unassignedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  unassignedLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12.5,
  },
  unassignedBoldVal: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '800',
  },
  assignFullButton: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  assignFullButtonText: {
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 14,
  },
  // Filter Card styles (ZM-02)
  filterCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  filterFieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  filterInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    marginBottom: 12,
  },
  filterDropdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterDropdownCol: {
    flex: 1,
  },
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownVal: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
  },
  filterButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  clearFiltersBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersBtnText: {
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 13,
  },
  addNewZoneBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewZoneBtnText: {
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 13,
  },
  resultsCountText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    marginBottom: 10,
  },
  zoneCardsList: {
    gap: 10,
  },
  zoneListItemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  zoneListItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  zoneListItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneListItemName: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  zoneListItemCodeLine: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 2,
  },
  zoneListItemStatsLine: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11.5,
    marginBottom: 2,
  },
  zoneListItemDateLine: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  // Details screen styles (ZM-03)
  detailsTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsTableLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
  },
  detailsTableValBold: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '800',
  },
  detailsActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  detailsEditBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsEditBtnText: {
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 13.5,
  },
  detailsStatusBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsStatusBtnText: {
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 13.5,
  },
  detailsTabsWrap: {
    marginVertical: adminSpacing.sm,
  },
  tabsScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailsTabPill: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    marginRight: 8,
  },
  detailsTabPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  detailsTabPillText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  detailsTabPillTextActive: {
    color: adminColors.onBrand,
  },
  scrollBarTrack: {
    height: 4,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.full,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  scrollBarThumb: {
    width: '35%',
    height: '100%',
    backgroundColor: adminColors.muted,
    borderRadius: adminRadius.full,
  },
  outlinedActionBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedActionText: {
    color: adminColors.brand,
    fontWeight: '800',
    fontSize: 13.5,
  },
  // Add Zone Form Styles (ZM-04)
  inputLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 10,
  },
  inputLabelRequired: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 10,
  },
  inputLabelOptional: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 10,
  },
  optionalTag: {
    color: adminColors.muted,
    fontWeight: '400',
  },
  formInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },
  inputHelperText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10.5,
    marginTop: 3,
  },
  inputHelperLink: {
    color: adminColors.brandDeep,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  cancelFullBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelFullBtnText: {
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 13.5,
  },
  // Assigned Locations Styles (ZM-05)
  assignedLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  assignedLocationLeft: {
    flex: 1,
  },
  assignedLocationName: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    fontSize: 13.5,
  },
  assignedLocationMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  removeLocButton: {
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: adminColors.card,
  },
  removeLocButtonText: {
    color: adminColors.danger.text,
    fontWeight: '800',
    fontSize: 12.5,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  historyTimestamp: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  historyActionText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 11,
  },
  // Location Management Styles (ZM-06)
  locationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: 12,
  },
  locationCardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  locationOutlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  locationOutlineBtnText: {
    color: adminColors.brand,
    fontWeight: '800',
    fontSize: 12.5,
  },
  // Add Location & Map Styles (ZM-07)
  schematicMapBox: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.md,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  schematicMapText: {
    ...adminType.body,
    color: adminColors.success.text,
    fontWeight: '700',
    fontSize: 13,
  },
  mapPinIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: adminColors.brand,
    marginBottom: 6,
  },
  mapPinText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '800',
    fontSize: 12,
  },
  // ZM-08 Zone Map & Boundary Styles
  toolChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  toolChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  toolChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  toolChipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 12,
  },
  toolChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  scrollIndicatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  scrollIndicatorArrow: {
    color: adminColors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  scrollIndicatorBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
  },
  scrollIndicatorThumb: {
    width: 90,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.muted,
  },
  mapToolChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 4,
  },
  mapToolChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  mapToolChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  mapToolChipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  mapToolChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  mapCanvasCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 3,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  mapCanvasHelperText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  mapActionSingleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  mapActionMutedText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },
  mapActionOverviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  mapMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  mapMetricLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  mapMetricValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  mapActionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  mapActionHalfBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapActionHalfBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  mapActionHalfBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  mapActionHalfBtnActiveText: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  mapActionHalfOutlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapActionHalfOutlineBtnText: {
    color: adminColors.brand,
    fontSize: 13,
    fontWeight: '800',
  },
  mapActionFullBtn: {
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  mapActionFullBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  mapActionFullBtnText: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13.5,
    fontWeight: '700',
  },
  mapActionFullBtnActiveText: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  mapSectionHeaderWrap: {
    marginTop: 4,
    marginBottom: 8,
  },
  mapSectionHeaderText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 14.5,
    fontWeight: '800',
  },
  mapOverlapCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 20,
    ...adminShadow.sm,
  },
  mapOverlapText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },
  schematicMapLarge: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.md,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schematicMapTitle: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },
  schematicMapSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
  },
  mapBottomSubtext: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11.5,
    marginTop: 8,
    marginHorizontal: 2,
  },
  // ZM-09 Zone Farmer List Styles
  farmerCountHeader: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '800',
    marginVertical: 10,
    marginLeft: 2,
  },
  farmerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  farmerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  farmerName: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  farmerBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  verifiedBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.sm,
  },
  verifiedBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontSize: 10.5,
    fontWeight: '800',
  },
  pendingBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.sm,
  },
  pendingBadgeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontSize: 10.5,
    fontWeight: '800',
  },
  farmerCodeLoc: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  farmerMetaText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  farmerCardBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  farmerCardBtn: {
    flex: 1,
    height: 40,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  farmerCardBtnText: {
    color: adminColors.brand,
    fontSize: 12.5,
    fontWeight: '800',
  },
  farmerProfileBtn: {
    height: 40,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  farmerProfileBtnText: {
    color: adminColors.brand,
    fontSize: 12.5,
    fontWeight: '800',
  },
  showMoreBtn: {
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginVertical: 12,
  },
  showMoreBtnText: {
    color: adminColors.brand,
    fontSize: 13,
    fontWeight: '800',
  },
  // ZM-10 & ZM-11 Styles
  assignStepperCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  assignStepperTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  assignStepPill: {
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  assignStepPillText: {
    ...adminType.caption,
    color: adminColors.brandSoft.text,
    fontSize: 11.5,
    fontWeight: '800',
  },
  assignStepNameText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12.5,
    fontWeight: '700',
  },
  assignProgressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  assignProgressSegment: {
    flex: 1,
    height: 5,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.border,
  },
  assignProgressSegmentActive: {
    backgroundColor: adminColors.brand,
  },
  assignBreadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  assignBreadcrumbChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.brandTintWarm,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  assignBreadcrumbLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  assignBreadcrumbVal: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontSize: 11.5,
    fontWeight: '700',
  },
  assignBreadcrumbArrow: {
    color: adminColors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  assignSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  assignSectionCount: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  assignChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 15,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  assignChoiceCardActive: {
    borderColor: adminColors.brand,
  },
  assignChoiceLeft: {
    flex: 1,
    paddingRight: 12,
  },
  assignChoiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  assignChoiceTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14.5,
    fontWeight: '800',
  },
  assignCodeBadge: {
    backgroundColor: adminColors.brandTintWarm,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  assignCodeBadgeText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontSize: 10.5,
    fontWeight: '700',
  },
  assignChoiceSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12.5,
  },
  assignChoosePill: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  assignChoosePillText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontSize: 12,
    fontWeight: '800',
  },
  assignBulkSwitchCard: {
    backgroundColor: adminColors.brandTintWarm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 20,
    alignItems: 'center',
  },
  assignBulkSwitchText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontSize: 12.5,
    fontWeight: '700',
  },
  assignSearchLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  assignSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  assignSearchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13.5,
    paddingVertical: 2,
  },
  assignSearchClear: {
    ...adminType.caption,
    color: adminColors.brand,
    fontSize: 12,
    fontWeight: '700',
  },
  assignCountRow: {
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 2,
  },
  assignCountText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  assignFarmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  assignFarmerCardSelected: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTintWarm,
  },
  assignCheckbox: {
    width: 22,
    height: 22,
    borderRadius: adminRadius.xs,
    borderWidth: 1.5,
    borderColor: adminColors.muted,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignCheckboxChecked: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  assignFarmerBody: {
    flex: 1,
  },
  assignFarmerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  assignVerifiedPill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  assignVerifiedPillText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontSize: 10.5,
    fontWeight: '700',
  },
  assignPendingPill: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  assignPendingPillText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontSize: 10.5,
    fontWeight: '700',
  },
  assignEmptyTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    marginBottom: 4,
  },
  assignEmptySubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  assignReviewFarmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: adminColors.brandTintWarm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assignReviewFarmerName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  assignReviewFarmerMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12,
  },
  disabledActionButton: {
    flex: 1,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledActionText: {
    color: adminColors.muted,
    fontWeight: '800',
    fontSize: 13.5,
  },
  bulkDropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    overflow: 'hidden',
  },
  bulkDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  bulkDropdownOptionActive: {
    backgroundColor: adminColors.brandTintWarm,
  },
  bulkDropdownOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  bulkDropdownOptionTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  bulkStatusPillWrap: {
    flexDirection: 'row',
    marginTop: 6,
  },
  bulkAssignedWarnPill: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  bulkAssignedWarnPillText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontSize: 11,
    fontWeight: '700',
  },
  bulkDisabledPill: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  bulkDisabledPillText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontSize: 11,
    fontWeight: '700',
  },
  bulkHelperCaption: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11.5,
    marginTop: 6,
    marginBottom: 16,
    marginLeft: 2,
  },
  dashedAlertBox: {
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.warning.bg,
    padding: 12,
    marginTop: 10,
  },
  dashedAlertItem: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  reviewLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 13,
  },
  reviewValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  // ZM-12 Styles
  recentTransferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  recentTransferCode: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '800',
    fontSize: 12,
    width: 70,
  },
  recentTransferText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 12.5,
    flex: 1,
  },
  // ZM-13 Styles
  warehouseCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  warehouseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  warehouseName: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  warehouseSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    marginBottom: 12,
  },
  turnOffMappingBtn: {
    height: 40,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  turnOffMappingText: {
    color: adminColors.danger.text,
    fontSize: 13,
    fontWeight: '800',
  },
  addMappingBtn: {
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  addMappingBtnText: {
    color: adminColors.onBrand,
    fontSize: 13.5,
    fontWeight: '800',
  },

  // ─── ZM-14 & ZM-15 Styles (Zone Reports & Status Deactivation) ───
  reportFilterCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  filterInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterInputCol: {
    flex: 1,
  },
  filterInputLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  optionalMutedText: {
    color: adminColors.muted,
    fontWeight: '400',
  },
  filterTextInput: {
    height: 42,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    fontSize: 13,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
  },
  filterFieldSpacing: {
    marginBottom: 12,
  },
  reportDropdownSelector: {
    height: 42,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
  },
  reportDropdownSelectorText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    fontWeight: '500',
  },
  inlineDropdownList: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginTop: 4,
    padding: 6,
    ...adminShadow.sm,
  },
  inlineDropdownItem: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: adminRadius.sm,
  },
  inlineDropdownItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  inlineDropdownItemText: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.ink,
  },
  inlineDropdownItemTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  reportExportBtn: {
    height: 44,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  reportExportBtnText: {
    color: adminColors.brand,
    fontSize: 14,
    fontWeight: '800',
  },
  reportSectionHeader: {
    marginTop: 6,
    marginBottom: 8,
  },
  reportSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontSize: 14.5,
    fontWeight: '800',
  },
  reportCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  reportBarItem: {
    marginBottom: 14,
  },
  reportBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportBarLabel: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },
  reportBarCount: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  reportProgressTrack: {
    height: 7,
    backgroundColor: adminColors.brandTintWarm,
    borderRadius: 4,
    overflow: 'hidden',
  },
  reportProgressFill: {
    height: 7,
    backgroundColor: adminColors.brand,
    borderRadius: 4,
  },
  reportMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reportMetricLabel: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.ink,
  },
  reportMetricValue: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  reportMetricSubValue: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
  },
  reportDashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  zoneIdentityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  zoneIdentityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  zoneIdentityTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
  },
  zoneStatusBadgeActive: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.xs,
  },
  zoneStatusBadgeActiveText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  zoneStatusBadgeInactive: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  zoneStatusBadgeInactiveText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
  },
  zoneIdentitySubtitle: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.muted,
    fontWeight: '500',
  },
  deactivationWarningCard: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  deactivationWarningText: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.warning.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  deactivationReasonWrap: {
    marginBottom: adminSpacing.md,
  },
  reasonLabel: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: adminColors.danger.text,
    fontWeight: '800',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    padding: 12,
    height: 84,
    fontSize: 13,
    color: adminColors.ink,
    textAlignVertical: 'top',
  },
  reasonHelperText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  deactivationButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  reactivateSolidBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactivateSolidBtnText: {
    color: adminColors.onBrand,
    fontSize: 13.5,
    fontWeight: '800',
  },
  archiveOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.danger.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveOutlineBtnText: {
    color: adminColors.danger.text,
    fontSize: 13.5,
    fontWeight: '800',
  },
  assignSuccessHeroCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    padding: 16,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  assignSuccessHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  assignSuccessIconCircle: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignSuccessTitleWrap: {
    flex: 1,
  },
  assignSuccessTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  assignSuccessSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 3,
    lineHeight: 18,
  },
  assignSuccessSourcePill: {
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  assignSuccessSourceText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.brandSoft.text,
  },
});
