import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface StockLedgerBatchesScreenProps {
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#D97736' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top track & pip */}
      <Line x1="3" y1="6.5" x2="21" y2="6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="15" y1="4" x2="15" y2="9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />

      {/* Middle track & pip */}
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="9.5" x2="8" y2="14.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />

      {/* Bottom track & pip */}
      <Line x1="3" y1="17.5" x2="21" y2="17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="15" x2="16" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockNoteIcon({ size = 16, color = '#E65100' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="10" width="16" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckGreenIcon({ size = 28, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="#E8F5E9" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Data Types & Fixtures ───────────────────────────────────────────────────

export interface TransferSourceRecord {
  transferId: string;
  status: string;
  sourceWarehouse: string;
  destWarehouse: string;
  product: string;
  grade: string;
  batchId: string;
  requestedKg: number;
  dispatchedKg: number;
  dispatchRef: string;
  transportText: string;
  receivedPhysically: string;
  damageMissingExcess: string;
  stillExpected: string;
  mismatch: string;
  reason: string;
  timeline: { id: string; date: string; actor: string; title: string }[];
}

export const TRANSFER_SOURCE_RECORD_TR0002: TransferSourceRecord = {
  transferId: 'TR-0002',
  status: 'In Transit',
  sourceWarehouse: 'Main Warehouse, Ooty',
  destWarehouse: 'Sub Warehouse, Kotagiri',
  product: 'Beans',
  grade: 'Grade 1',
  batchId: 'BT-0002',
  requestedKg: 50,
  dispatchedKg: 50,
  dispatchRef: 'DSP-TR-0002',
  transportText: 'Demo vehicle (placeholder)',
  receivedPhysically: '0 kg',
  damageMissingExcess: '0 / 0 / 0 kg',
  stillExpected: '50 kg',
  mismatch: '50 kg still expected',
  reason: 'Demo transfer reason (placeholder).',
  timeline: [
    { id: 'tl-1', date: '12 Oct 2026, 12:00', actor: 'Demo Main Warehouse Admin', title: 'Goods in transit' },
    { id: 'tl-2', date: '12 Oct 2026, 12:00', actor: 'Demo Main Warehouse Admin', title: 'Stock dispatched: 50 kg' },
    { id: 'tl-3', date: '12 Oct 2026, 09:10', actor: 'Demo Main Warehouse Admin', title: 'Transfer submitted' },
  ],
};

export type TopTab = 'Current stock' | 'Batches' | 'Ledger';
export type WarehouseFilter = 'All Warehouses' | 'Ooty' | 'Coonoor' | 'Kotagiri' | 'Gudalur Market';
export type GradeFilter = 'All' | 'Grade 1' | 'Grade 2' | 'Grade 3';
export type StockStatusFilter = 'All' | 'In stock' | 'Low stock' | 'Depleted';
export type MovementTypeFilter = 'All' | 'Receipt' | 'Sale' | 'Transfer out' | 'Transfer in' | 'Adjustment';

// 1. Current Stock Items (Exact 23 items matching Screenshot 1 "23 Current stock")
export interface CurrentStockItem {
  id: string;
  name: string;
  grade: 'Grade 1' | 'Grade 2' | 'Grade 3';
  warehouse: 'Ooty' | 'Coonoor' | 'Kotagiri' | 'Gudalur Market';
  locationCode: string;
  onHandKg: number;
  allocatedKg: number;
  reservedKg: number;
  availableKg: number;
  status: 'In stock' | 'Low' | 'Depleted';
  lastMovement: string;
}

const INITIAL_CURRENT_STOCKS: CurrentStockItem[] = [
  {
    id: 'cs-01',
    name: 'Tomato',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-01',
    onHandKg: 420,
    allocatedKg: 120,
    reservedKg: 50,
    availableKg: 250,
    status: 'In stock',
    lastMovement: '13 Oct 2026, 09:00',
  },
  {
    id: 'cs-02',
    name: 'Carrot',
    grade: 'Grade 1',
    warehouse: 'Coonoor',
    locationCode: 'SL-CNR-02',
    onHandKg: 260,
    allocatedKg: 80,
    reservedKg: 30,
    availableKg: 150,
    status: 'Low',
    lastMovement: '11 Oct 2026, 14:00',
  },
  {
    id: 'cs-03',
    name: 'Potato',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-02',
    onHandKg: 340,
    allocatedKg: 60,
    reservedKg: 40,
    availableKg: 240,
    status: 'In stock',
    lastMovement: '12 Oct 2026, 16:30',
  },
  {
    id: 'cs-04',
    name: 'Beans',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-03',
    onHandKg: 300,
    allocatedKg: 50,
    reservedKg: 25,
    availableKg: 225,
    status: 'In stock',
    lastMovement: '12 Oct 2026, 12:00',
  },
  {
    id: 'cs-05',
    name: 'Cabbage',
    grade: 'Grade 2',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-04',
    onHandKg: 100,
    allocatedKg: 30,
    reservedKg: 10,
    availableKg: 60,
    status: 'In stock',
    lastMovement: '10 Oct 2026, 10:00',
  },
  {
    id: 'cs-06',
    name: 'Beetroot',
    grade: 'Grade 1',
    warehouse: 'Coonoor',
    locationCode: 'SL-CNR-01',
    onHandKg: 220,
    allocatedKg: 40,
    reservedKg: 20,
    availableKg: 160,
    status: 'In stock',
    lastMovement: '12 Oct 2026, 15:45',
  },
  {
    id: 'cs-07',
    name: 'Capsicum',
    grade: 'Grade 1',
    warehouse: 'Coonoor',
    locationCode: 'SL-CNR-03',
    onHandKg: 90,
    allocatedKg: 40,
    reservedKg: 20,
    availableKg: 30,
    status: 'Low',
    lastMovement: '11 Oct 2026, 11:30',
  },
  {
    id: 'cs-08',
    name: 'Broccoli',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-05',
    onHandKg: 180,
    allocatedKg: 50,
    reservedKg: 30,
    availableKg: 100,
    status: 'In stock',
    lastMovement: '12 Oct 2026, 17:15',
  },
  {
    id: 'cs-09',
    name: 'Cauliflower',
    grade: 'Grade 2',
    warehouse: 'Kotagiri',
    locationCode: 'SL-KOT-01',
    onHandKg: 0,
    allocatedKg: 0,
    reservedKg: 0,
    availableKg: 0,
    status: 'Depleted',
    lastMovement: '08 Oct 2026, 14:00',
  },
  {
    id: 'cs-10',
    name: 'Garlic',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-06',
    onHandKg: 500,
    allocatedKg: 100,
    reservedKg: 50,
    availableKg: 350,
    status: 'In stock',
    lastMovement: '13 Oct 2026, 08:30',
  },
  {
    id: 'cs-11',
    name: 'Ginger',
    grade: 'Grade 1',
    warehouse: 'Gudalur Market',
    locationCode: 'SL-GUD-01',
    onHandKg: 150,
    allocatedKg: 30,
    reservedKg: 20,
    availableKg: 100,
    status: 'In stock',
    lastMovement: '12 Oct 2026, 18:00',
  },
  {
    id: 'cs-12',
    name: 'Radish',
    grade: 'Grade 2',
    warehouse: 'Coonoor',
    locationCode: 'SL-CNR-04',
    onHandKg: 140,
    allocatedKg: 40,
    reservedKg: 20,
    availableKg: 80,
    status: 'In stock',
    lastMovement: '10 Oct 2026, 16:20',
  },
  {
    id: 'cs-13',
    name: 'Peas',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-07',
    onHandKg: 80,
    allocatedKg: 50,
    reservedKg: 15,
    availableKg: 15,
    status: 'Low',
    lastMovement: '11 Oct 2026, 13:00',
  },
  {
    id: 'cs-14',
    name: 'Spinach',
    grade: 'Grade 1',
    warehouse: 'Gudalur Market',
    locationCode: 'SL-GUD-02',
    onHandKg: 95,
    allocatedKg: 25,
    reservedKg: 10,
    availableKg: 60,
    status: 'In stock',
    lastMovement: '13 Oct 2026, 07:45',
  },
  {
    id: 'cs-15',
    name: 'Onion',
    grade: 'Grade 2',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-08',
    onHandKg: 620,
    allocatedKg: 120,
    reservedKg: 80,
    availableKg: 420,
    status: 'In stock',
    lastMovement: '12 Oct 2026, 19:10',
  },
  {
    id: 'cs-16',
    name: 'Zucchini',
    grade: 'Grade 1',
    warehouse: 'Kotagiri',
    locationCode: 'SL-KOT-02',
    onHandKg: 0,
    allocatedKg: 0,
    reservedKg: 0,
    availableKg: 0,
    status: 'Depleted',
    lastMovement: '07 Oct 2026, 11:15',
  },
  {
    id: 'cs-17',
    name: 'Leek',
    grade: 'Grade 2',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-09',
    onHandKg: 110,
    allocatedKg: 20,
    reservedKg: 10,
    availableKg: 80,
    status: 'In stock',
    lastMovement: '10 Oct 2026, 09:30',
  },
  {
    id: 'cs-18',
    name: 'Turnip',
    grade: 'Grade 2',
    warehouse: 'Coonoor',
    locationCode: 'SL-CNR-05',
    onHandKg: 75,
    allocatedKg: 30,
    reservedKg: 25,
    availableKg: 20,
    status: 'Low',
    lastMovement: '09 Oct 2026, 15:20',
  },
  {
    id: 'cs-19',
    name: 'Sweet Corn',
    grade: 'Grade 1',
    warehouse: 'Gudalur Market',
    locationCode: 'SL-GUD-03',
    onHandKg: 210,
    allocatedKg: 50,
    reservedKg: 20,
    availableKg: 140,
    status: 'In stock',
    lastMovement: '12 Oct 2026, 14:15',
  },
  {
    id: 'cs-20',
    name: 'Celery',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-10',
    onHandKg: 85,
    allocatedKg: 30,
    reservedKg: 15,
    availableKg: 40,
    status: 'In stock',
    lastMovement: '11 Oct 2026, 10:40',
  },
  {
    id: 'cs-21',
    name: 'Lettuce',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-11',
    onHandKg: 65,
    allocatedKg: 30,
    reservedKg: 20,
    availableKg: 15,
    status: 'Low',
    lastMovement: '13 Oct 2026, 06:30',
  },
  {
    id: 'cs-22',
    name: 'Red Cabbage',
    grade: 'Grade 2',
    warehouse: 'Coonoor',
    locationCode: 'SL-CNR-06',
    onHandKg: 130,
    allocatedKg: 30,
    reservedKg: 20,
    availableKg: 80,
    status: 'In stock',
    lastMovement: '10 Oct 2026, 12:15',
  },
  {
    id: 'cs-23',
    name: 'Mushroom',
    grade: 'Grade 1',
    warehouse: 'Ooty',
    locationCode: 'SL-OOT-12',
    onHandKg: 140,
    allocatedKg: 40,
    reservedKg: 20,
    availableKg: 80,
    status: 'In stock',
    lastMovement: '13 Oct 2026, 08:00',
  },
];

// 2. Batch Items (Exact 11 batches matching Screenshot 3 "11 batches")
export interface BatchItem {
  id: string;
  batchId: string;
  batchName: string;
  cropGrade: string;
  uniqueBatchCode: string;
  warehouse: string;
  storageLocation: string;
  receivedQtyKg: number;
  currentQtyKg: number;
  allocatedReservedText: string;
  sourceGoodsReceipt: string;
  linkedPurchaseOrder: string;
  sourceFarmer: string;
  receivedDate: string;
  status: 'Active' | 'Closed' | 'Depleted';
  relatedMovements: {
    id: string;
    type: string;
    amountText: string;
    isPositive?: boolean;
    date: string;
    ref: string;
  }[];
}

const INITIAL_BATCHES: BatchItem[] = [
  {
    id: 'batch-0001',
    batchId: 'BT-0001',
    batchName: 'BT-0001 · Tomato Grade 1',
    cropGrade: 'Tomato · Grade 1',
    uniqueBatchCode: 'TOH-OOT-20261007-TOM-G1-01',
    warehouse: 'Main Warehouse, Ooty',
    storageLocation: 'Cold room A',
    receivedQtyKg: 200,
    currentQtyKg: 100,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0001',
    linkedPurchaseOrder: 'PO-0001',
    sourceFarmer: 'Ramesh Kumar (FMR-00124)',
    receivedDate: '7 Oct 2026, 11:00',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-1', type: 'Receipt', amountText: '+200 kg', isPositive: true, date: '7 Oct 2026, 11:00', ref: 'GR-0001' },
      { id: 'rel-2', type: 'Sale', amountText: '-40 kg', isPositive: false, date: '9 Oct 2026, 14:00', ref: 'SO-0001' },
      { id: 'rel-3', type: 'Transfer out', amountText: '-60 kg', isPositive: false, date: '8 Oct 2026, 12:00', ref: 'TR-0001' },
    ],
  },
  {
    id: 'batch-0002',
    batchId: 'BT-0002',
    batchName: 'BT-0002 · Beans Grade 1',
    cropGrade: 'Beans · Grade 1',
    uniqueBatchCode: 'TOH-OOT-20261008-BEA-G1-01',
    warehouse: 'Main Warehouse, Ooty',
    storageLocation: 'Dry store B',
    receivedQtyKg: 300,
    currentQtyKg: 225,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0002',
    linkedPurchaseOrder: 'PO-0002',
    sourceFarmer: 'Suresh Patel (FMR-00142)',
    receivedDate: '8 Oct 2026, 09:30',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-4', type: 'Receipt', amountText: '+300 kg', isPositive: true, date: '8 Oct 2026, 09:30', ref: 'GR-0002' },
      { id: 'rel-5', type: 'Transfer out', amountText: '-50 kg', isPositive: false, date: '12 Oct 2026, 12:00', ref: 'TR-0002' },
      { id: 'rel-6', type: 'Sale', amountText: '-25 kg', isPositive: false, date: '10 Oct 2026, 14:00', ref: 'SO-0004' },
    ],
  },
  {
    id: 'batch-0007',
    batchId: 'BT-0007',
    batchName: 'BT-0007 · Cabbage Grade 2',
    cropGrade: 'Cabbage · Grade 2',
    uniqueBatchCode: 'TOH-OOT-20261005-CAB-G2-07',
    warehouse: 'Main Warehouse, Ooty',
    storageLocation: 'Dry store B',
    receivedQtyKg: 100,
    currentQtyKg: 60,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0013',
    linkedPurchaseOrder: 'PO-0013',
    sourceFarmer: 'Kavitha S. (FMR-00188)',
    receivedDate: '5 Oct 2026, 14:00',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-7', type: 'Receipt', amountText: '+100 kg', isPositive: true, date: '5 Oct 2026, 14:00', ref: 'GR-0013' },
      { id: 'rel-8', type: 'Sale', amountText: '-40 kg', isPositive: false, date: '10 Oct 2026, 10:00', ref: 'SO-0009' },
    ],
  },
  {
    id: 'batch-0008',
    batchId: 'BT-0008',
    batchName: 'BT-0008 · Potato Grade 1',
    cropGrade: 'Potato · Grade 1',
    uniqueBatchCode: 'TOH-OOT-20261003-POT-G1-08',
    warehouse: 'Main Warehouse, Ooty',
    storageLocation: 'Dry store B',
    receivedQtyKg: 200,
    currentQtyKg: 120,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0014',
    linkedPurchaseOrder: 'PO-0014',
    sourceFarmer: 'Muthu R. (FMR-00109)',
    receivedDate: '3 Oct 2026, 16:20',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-9', type: 'Receipt', amountText: '+200 kg', isPositive: true, date: '3 Oct 2026, 16:20', ref: 'GR-0014' },
      { id: 'rel-10', type: 'Transfer out', amountText: '-80 kg', isPositive: false, date: '10 Oct 2026, 12:00', ref: 'TR-0005' },
    ],
  },
  {
    id: 'batch-0003',
    batchId: 'BT-0003',
    batchName: 'BT-0003 · Carrot Grade 1',
    cropGrade: 'Carrot · Grade 1',
    uniqueBatchCode: 'TOH-CNR-20261004-CAR-G1-03',
    warehouse: 'Sub Warehouse, Coonoor',
    storageLocation: 'Cooler Unit 1',
    receivedQtyKg: 260,
    currentQtyKg: 150,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0004',
    linkedPurchaseOrder: 'PO-0004',
    sourceFarmer: 'Devi P. (FMR-00115)',
    receivedDate: '4 Oct 2026, 10:15',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-11', type: 'Receipt', amountText: '+260 kg', isPositive: true, date: '4 Oct 2026, 10:15', ref: 'GR-0004' },
      { id: 'rel-12', type: 'Sale', amountText: '-110 kg', isPositive: false, date: '11 Oct 2026, 14:00', ref: 'SO-0006' },
    ],
  },
  {
    id: 'batch-0004',
    batchId: 'BT-0004',
    batchName: 'BT-0004 · Beetroot Grade 1',
    cropGrade: 'Beetroot · Grade 1',
    uniqueBatchCode: 'TOH-CNR-20261006-BEE-G1-04',
    warehouse: 'Sub Warehouse, Coonoor',
    storageLocation: 'Cooler Unit 2',
    receivedQtyKg: 220,
    currentQtyKg: 160,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0007',
    linkedPurchaseOrder: 'PO-0007',
    sourceFarmer: 'Anand K. (FMR-00133)',
    receivedDate: '6 Oct 2026, 11:45',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-13', type: 'Receipt', amountText: '+220 kg', isPositive: true, date: '6 Oct 2026, 11:45', ref: 'GR-0007' },
      { id: 'rel-14', type: 'Sale', amountText: '-60 kg', isPositive: false, date: '12 Oct 2026, 15:45', ref: 'SO-0008' },
    ],
  },
  {
    id: 'batch-0005',
    batchId: 'BT-0005',
    batchName: 'BT-0005 · Garlic Grade 1',
    cropGrade: 'Garlic · Grade 1',
    uniqueBatchCode: 'TOH-OOT-20261002-GAR-G1-05',
    warehouse: 'Main Warehouse, Ooty',
    storageLocation: 'Dry store A',
    receivedQtyKg: 500,
    currentQtyKg: 350,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0008',
    linkedPurchaseOrder: 'PO-0008',
    sourceFarmer: 'Rajesh V. (FMR-00101)',
    receivedDate: '2 Oct 2026, 08:30',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-15', type: 'Receipt', amountText: '+500 kg', isPositive: true, date: '2 Oct 2026, 08:30', ref: 'GR-0008' },
      { id: 'rel-16', type: 'Sale', amountText: '-150 kg', isPositive: false, date: '13 Oct 2026, 08:30', ref: 'SO-0010' },
    ],
  },
  {
    id: 'batch-0006',
    batchId: 'BT-0006',
    batchName: 'BT-0006 · Ginger Grade 1',
    cropGrade: 'Ginger · Grade 1',
    uniqueBatchCode: 'TOH-GUD-20261009-GIN-G1-06',
    warehouse: 'Sub Warehouse, Gudalur Market',
    storageLocation: 'Ventilated Bin 1',
    receivedQtyKg: 150,
    currentQtyKg: 100,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0009',
    linkedPurchaseOrder: 'PO-0009',
    sourceFarmer: 'Gopal N. (FMR-00176)',
    receivedDate: '9 Oct 2026, 13:20',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-17', type: 'Receipt', amountText: '+150 kg', isPositive: true, date: '9 Oct 2026, 13:20', ref: 'GR-0009' },
      { id: 'rel-18', type: 'Sale', amountText: '-50 kg', isPositive: false, date: '12 Oct 2026, 18:00', ref: 'SO-0012' },
    ],
  },
  {
    id: 'batch-0009',
    batchId: 'BT-0009',
    batchName: 'BT-0009 · Broccoli Grade 1',
    cropGrade: 'Broccoli · Grade 1',
    uniqueBatchCode: 'TOH-OOT-20261009-BRO-G1-09',
    warehouse: 'Main Warehouse, Ooty',
    storageLocation: 'Cold room B',
    receivedQtyKg: 180,
    currentQtyKg: 100,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0015',
    linkedPurchaseOrder: 'PO-0015',
    sourceFarmer: 'Murugan C. (FMR-00164)',
    receivedDate: '9 Oct 2026, 11:30',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-19', type: 'Receipt', amountText: '+180 kg', isPositive: true, date: '9 Oct 2026, 11:30', ref: 'GR-0015' },
      { id: 'rel-20', type: 'Sale', amountText: '-80 kg', isPositive: false, date: '12 Oct 2026, 17:15', ref: 'SO-0014' },
    ],
  },
  {
    id: 'batch-0010',
    batchId: 'BT-0010',
    batchName: 'BT-0010 · Onion Grade 2',
    cropGrade: 'Onion · Grade 2',
    uniqueBatchCode: 'TOH-OOT-20261001-ONI-G2-10',
    warehouse: 'Main Warehouse, Ooty',
    storageLocation: 'Dry store A',
    receivedQtyKg: 620,
    currentQtyKg: 420,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0016',
    linkedPurchaseOrder: 'PO-0016',
    sourceFarmer: 'Kannan E. (FMR-00152)',
    receivedDate: '1 Oct 2026, 09:00',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-21', type: 'Receipt', amountText: '+620 kg', isPositive: true, date: '1 Oct 2026, 09:00', ref: 'GR-0016' },
      { id: 'rel-22', type: 'Sale', amountText: '-200 kg', isPositive: false, date: '12 Oct 2026, 19:10', ref: 'SO-0015' },
    ],
  },
  {
    id: 'batch-0011',
    batchId: 'BT-0011',
    batchName: 'BT-0011 · Sweet Corn Grade 1',
    cropGrade: 'Sweet Corn · Grade 1',
    uniqueBatchCode: 'TOH-GUD-20261010-CRN-G1-11',
    warehouse: 'Sub Warehouse, Gudalur Market',
    storageLocation: 'Cooler Unit 1',
    receivedQtyKg: 210,
    currentQtyKg: 140,
    allocatedReservedText: '0 kg / 0 kg',
    sourceGoodsReceipt: 'GR-0017',
    linkedPurchaseOrder: 'PO-0017',
    sourceFarmer: 'Senthil A. (FMR-00190)',
    receivedDate: '10 Oct 2026, 15:00',
    status: 'Active',
    relatedMovements: [
      { id: 'rel-23', type: 'Receipt', amountText: '+210 kg', isPositive: true, date: '10 Oct 2026, 15:00', ref: 'GR-0017' },
      { id: 'rel-24', type: 'Sale', amountText: '-70 kg', isPositive: false, date: '12 Oct 2026, 14:15', ref: 'SO-0016' },
    ],
  },
];

// 3. Movement / Ledger Items (Exact 21 movements matching Screenshot 4 Middle "21 movements")
export interface MovementItem {
  id: string;
  movementId: string;
  type: 'Receipt' | 'Sale' | 'Transfer out' | 'Transfer in' | 'Adjustment';
  amountKg: string;
  date: string;
  performedBy: string;
  batchId: string;
  productGrade: string;
  warehouse: string;
  reference: string;
  reason?: string;
}

const INITIAL_MOVEMENTS: MovementItem[] = [
  {
    id: 'mv-0016',
    movementId: 'MV-0016',
    type: 'Transfer out',
    amountKg: '-50 kg',
    date: '12 Oct 2026, 12:00',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0002',
    productGrade: 'Beans · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'TR-0002',
    reason: '—',
  },
  {
    id: 'mv-0010',
    movementId: 'MV-0010',
    type: 'Sale',
    amountKg: '-25 kg',
    date: '10 Oct 2026, 14:00',
    performedBy: 'System',
    batchId: 'BT-0002',
    productGrade: 'Beans · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'SO-0004',
    reason: '—',
  },
  {
    id: 'mv-0019',
    movementId: 'MV-0019',
    type: 'Transfer out',
    amountKg: '-80 kg',
    date: '10 Oct 2026, 12:00',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0008',
    productGrade: 'Potato · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'TR-0005',
    reason: '—',
  },
  {
    id: 'mv-0009',
    movementId: 'MV-0009',
    type: 'Sale',
    amountKg: '-40 kg',
    date: '9 Oct 2026, 14:00',
    performedBy: 'System',
    batchId: 'BT-0001',
    productGrade: 'Tomato · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'SO-0001',
    reason: '—',
  },
  {
    id: 'mv-0014',
    movementId: 'MV-0014',
    type: 'Transfer out',
    amountKg: '-60 kg',
    date: '8 Oct 2026, 12:00',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0001',
    productGrade: 'Tomato · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'TR-0001',
    reason: '—',
  },
  {
    id: 'mv-0001',
    movementId: 'MV-0001',
    type: 'Receipt',
    amountKg: '+200 kg',
    date: '7 Oct 2026, 11:00',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0001',
    productGrade: 'Tomato · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'GR-0001',
    reason: 'Initial farmer batch intake',
  },
  {
    id: 'mv-0002',
    movementId: 'MV-0002',
    type: 'Receipt',
    amountKg: '+300 kg',
    date: '8 Oct 2026, 09:30',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0002',
    productGrade: 'Beans · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'GR-0002',
    reason: 'Initial farmer batch intake',
  },
  {
    id: 'mv-0003',
    movementId: 'MV-0003',
    type: 'Receipt',
    amountKg: '+100 kg',
    date: '5 Oct 2026, 14:00',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0007',
    productGrade: 'Cabbage · Grade 2',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'GR-0013',
    reason: 'Direct procurement receipt',
  },
  {
    id: 'mv-0004',
    movementId: 'MV-0004',
    type: 'Receipt',
    amountKg: '+200 kg',
    date: '3 Oct 2026, 16:20',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0008',
    productGrade: 'Potato · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'GR-0014',
    reason: 'Initial farmer batch intake',
  },
  {
    id: 'mv-0005',
    movementId: 'MV-0005',
    type: 'Sale',
    amountKg: '-40 kg',
    date: '10 Oct 2026, 10:00',
    performedBy: 'System',
    batchId: 'BT-0007',
    productGrade: 'Cabbage · Grade 2',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'SO-0009',
    reason: '—',
  },
  {
    id: 'mv-0006',
    movementId: 'MV-0006',
    type: 'Receipt',
    amountKg: '+260 kg',
    date: '4 Oct 2026, 10:15',
    performedBy: 'Coonoor Admin',
    batchId: 'BT-0003',
    productGrade: 'Carrot · Grade 1',
    warehouse: 'Sub Warehouse, Coonoor',
    reference: 'GR-0004',
    reason: 'Intake receipt',
  },
  {
    id: 'mv-0007',
    movementId: 'MV-0007',
    type: 'Sale',
    amountKg: '-110 kg',
    date: '11 Oct 2026, 14:00',
    performedBy: 'System',
    batchId: 'BT-0003',
    productGrade: 'Carrot · Grade 1',
    warehouse: 'Sub Warehouse, Coonoor',
    reference: 'SO-0006',
    reason: '—',
  },
  {
    id: 'mv-0008',
    movementId: 'MV-0008',
    type: 'Receipt',
    amountKg: '+220 kg',
    date: '6 Oct 2026, 11:45',
    performedBy: 'Coonoor Admin',
    batchId: 'BT-0004',
    productGrade: 'Beetroot · Grade 1',
    warehouse: 'Sub Warehouse, Coonoor',
    reference: 'GR-0007',
    reason: 'Intake receipt',
  },
  {
    id: 'mv-0011',
    movementId: 'MV-0011',
    type: 'Sale',
    amountKg: '-60 kg',
    date: '12 Oct 2026, 15:45',
    performedBy: 'System',
    batchId: 'BT-0004',
    productGrade: 'Beetroot · Grade 1',
    warehouse: 'Sub Warehouse, Coonoor',
    reference: 'SO-0008',
    reason: '—',
  },
  {
    id: 'mv-0012',
    movementId: 'MV-0012',
    type: 'Receipt',
    amountKg: '+500 kg',
    date: '2 Oct 2026, 08:30',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0005',
    productGrade: 'Garlic · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'GR-0008',
    reason: 'Intake receipt',
  },
  {
    id: 'mv-0013',
    movementId: 'MV-0013',
    type: 'Sale',
    amountKg: '-150 kg',
    date: '13 Oct 2026, 08:30',
    performedBy: 'System',
    batchId: 'BT-0005',
    productGrade: 'Garlic · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'SO-0010',
    reason: '—',
  },
  {
    id: 'mv-0015',
    movementId: 'MV-0015',
    type: 'Receipt',
    amountKg: '+150 kg',
    date: '9 Oct 2026, 13:20',
    performedBy: 'Gudalur Market Admin',
    batchId: 'BT-0006',
    productGrade: 'Ginger · Grade 1',
    warehouse: 'Sub Warehouse, Gudalur Market',
    reference: 'GR-0009',
    reason: 'Intake receipt',
  },
  {
    id: 'mv-0017',
    movementId: 'MV-0017',
    type: 'Transfer in',
    amountKg: '+50 kg',
    date: '12 Oct 2026, 18:00',
    performedBy: 'Gudalur Market Admin',
    batchId: 'BT-0006',
    productGrade: 'Ginger · Grade 1',
    warehouse: 'Sub Warehouse, Gudalur Market',
    reference: 'TR-0009',
    reason: 'Inter-warehouse arrival',
  },
  {
    id: 'mv-0018',
    movementId: 'MV-0018',
    type: 'Receipt',
    amountKg: '+180 kg',
    date: '9 Oct 2026, 11:30',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0009',
    productGrade: 'Broccoli · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'GR-0015',
    reason: 'Intake receipt',
  },
  {
    id: 'mv-0020',
    movementId: 'MV-0020',
    type: 'Adjustment',
    amountKg: '-20 kg',
    date: '12 Oct 2026, 17:15',
    performedBy: 'System',
    batchId: 'BT-0009',
    productGrade: 'Broccoli · Grade 1',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'ADJ-0004',
    reason: 'Quality shrinkage adjustment',
  },
  {
    id: 'mv-0021',
    movementId: 'MV-0021',
    type: 'Receipt',
    amountKg: '+620 kg',
    date: '1 Oct 2026, 09:00',
    performedBy: 'Demo Main Warehouse Admin',
    batchId: 'BT-0010',
    productGrade: 'Onion · Grade 2',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'GR-0016',
    reason: 'Intake receipt',
  },
];

export function StockLedgerBatchesScreen({ onBack }: StockLedgerBatchesScreenProps) {
  // Navigation / active tab state
  const [activeTab, setActiveTab] = useState<TopTab>('Current stock');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected views
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<MovementItem | null>(null);

  // Source Record states (Matching Screenshots 1 to 5)
  const [selectedSourceTransfer, setSelectedSourceTransfer] = useState<TransferSourceRecord | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveQuantity, setReceiveQuantity] = useState('');
  const [damagedQty, setDamagedQty] = useState('0');
  const [missingQty, setMissingQty] = useState('0');
  const [excessQty, setExcessQty] = useState('0');
  const [actualProduct, setActualProduct] = useState('Beans');
  const [actualGrade, setActualGrade] = useState('Grade 1');
  const [storageLocation, setStorageLocation] = useState('Select');
  const [mismatchReason, setMismatchReason] = useState('');
  const [notes, setNotes] = useState('');
  const [hasReceivedQtyError, setHasReceivedQtyError] = useState(false);

  // Dropdowns for Receive at Destination form
  const [receiveProductDropdownOpen, setReceiveProductDropdownOpen] = useState(false);
  const [receiveGradeDropdownOpen, setReceiveGradeDropdownOpen] = useState(false);
  const [receiveStorageDropdownOpen, setReceiveStorageDropdownOpen] = useState(false);

  // Success popup modal
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleOpenSourceRecord = (ref: string) => {
    if (ref.startsWith('TR-') || ref === 'TR-0002') {
      setSelectedSourceTransfer(TRANSFER_SOURCE_RECORD_TR0002);
    } else {
      Alert.alert(
        'Source Record',
        `Reference ${ref}: Source record view is available in relevant module.`
      );
    }
  };

  const handleOpenReceiveModal = () => {
    setReceiveQuantity('');
    setDamagedQty('0');
    setMissingQty('0');
    setExcessQty('0');
    setActualProduct('Beans');
    setActualGrade('Grade 1');
    setStorageLocation('Select');
    setMismatchReason('');
    setNotes('');
    setHasReceivedQtyError(false);
    setReceiveProductDropdownOpen(false);
    setReceiveGradeDropdownOpen(false);
    setReceiveStorageDropdownOpen(false);
    setShowReceiveModal(true);
  };

  const handleRecordReceipt = () => {
    if (!receiveQuantity || !receiveQuantity.trim() || Number(receiveQuantity) <= 0) {
      setHasReceivedQtyError(true);
      return;
    }
    setHasReceivedQtyError(false);
    setShowReceiveModal(false);
    setSelectedSourceTransfer(null);
    setShowSuccessPopup(true);
    Alert.alert(
      'Saved successfully',
      `Goods receipt for ${selectedSourceTransfer?.transferId ?? 'TR-0002'} recorded successfully.`
    );
  };

  // Filters state for Current Stock & Batches
  const [appliedWarehouse, setAppliedWarehouse] = useState<WarehouseFilter>('All Warehouses');
  const [appliedGrade, setAppliedGrade] = useState<GradeFilter>('All');
  const [appliedStatus, setAppliedStatus] = useState<StockStatusFilter>('All');

  // Filters state for Ledger (Matching Screenshots 1, 2, 3)
  const [appliedMovementType, setAppliedMovementType] = useState<MovementTypeFilter>('All');
  const [appliedLedgerGrade, setAppliedLedgerGrade] = useState<GradeFilter>('All');

  // Modal draft filters
  const [draftWarehouse, setDraftWarehouse] = useState<WarehouseFilter>('All Warehouses');
  const [draftGrade, setDraftGrade] = useState<GradeFilter>('All');
  const [draftStatus, setDraftStatus] = useState<StockStatusFilter>('All');

  const [draftMovementType, setDraftMovementType] = useState<MovementTypeFilter>('All');
  const [draftLedgerGrade, setDraftLedgerGrade] = useState<GradeFilter>('All');

  // Dropdown toggles
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [whDropdownOpen, setWhDropdownOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [movementTypeDropdownOpen, setMovementTypeDropdownOpen] = useState(false);
  const [ledgerGradeDropdownOpen, setLedgerGradeDropdownOpen] = useState(false);

  const openFilterModal = () => {
    if (activeTab === 'Ledger') {
      setDraftMovementType(appliedMovementType);
      setDraftLedgerGrade(appliedLedgerGrade);
      setMovementTypeDropdownOpen(false);
      setLedgerGradeDropdownOpen(false);
    } else {
      setDraftWarehouse(appliedWarehouse);
      setDraftGrade(appliedGrade);
      setDraftStatus(appliedStatus);
      setWhDropdownOpen(false);
      setGradeDropdownOpen(false);
      setStatusDropdownOpen(false);
    }
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    if (activeTab === 'Ledger') {
      setAppliedMovementType(draftMovementType);
      setAppliedLedgerGrade(draftLedgerGrade);
    } else {
      setAppliedWarehouse(draftWarehouse);
      setAppliedGrade(draftGrade);
      setAppliedStatus(draftStatus);
    }
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    if (activeTab === 'Ledger') {
      setDraftMovementType('All');
      setDraftLedgerGrade('All');
      setAppliedMovementType('All');
      setAppliedLedgerGrade('All');
    } else {
      setDraftWarehouse('All Warehouses');
      setDraftGrade('All');
      setDraftStatus('All');
      setAppliedWarehouse('All Warehouses');
      setAppliedGrade('All');
      setAppliedStatus('All');
    }
    setShowFilterModal(false);
  };

  // ── Filtered Records ──
  const filteredCurrentStocks = useMemo(() => {
    return INITIAL_CURRENT_STOCKS.filter((item) => {
      if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (appliedWarehouse !== 'All Warehouses' && item.warehouse !== appliedWarehouse) {
        return false;
      }
      if (appliedGrade !== 'All' && item.grade !== appliedGrade) {
        return false;
      }
      if (appliedStatus !== 'All' && item.status !== appliedStatus) {
        return false;
      }
      return true;
    });
  }, [searchQuery, appliedWarehouse, appliedGrade, appliedStatus]);

  const filteredBatches = useMemo(() => {
    return INITIAL_BATCHES.filter((b) => {
      if (searchQuery.trim() && !b.batchName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (appliedWarehouse !== 'All Warehouses' && !b.warehouse.includes(appliedWarehouse)) {
        return false;
      }
      if (appliedGrade !== 'All' && !b.cropGrade.includes(appliedGrade)) {
        return false;
      }
      return true;
    });
  }, [searchQuery, appliedWarehouse, appliedGrade]);

  const filteredMovements = useMemo(() => {
    return INITIAL_MOVEMENTS.filter((m) => {
      if (
        searchQuery.trim() &&
        !m.movementId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.productGrade.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.reference.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.type.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (appliedMovementType !== 'All' && m.type !== appliedMovementType) {
        return false;
      }
      if (appliedLedgerGrade !== 'All' && !m.productGrade.includes(appliedLedgerGrade)) {
        return false;
      }
      return true;
    });
  }, [searchQuery, appliedMovementType, appliedLedgerGrade]);

  // ═════════════════════════════════════════════════════════════════════════════
  // VIEW: BATCH DETAILS SCREEN (Matching Screenshot 4 Left)
  // ═════════════════════════════════════════════════════════════════════════════
  if (selectedBatch) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: "← Batch BT-0001" */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setSelectedBatch(null)}
              activeOpacity={0.8}
            >
              <BackArrowWhiteIcon />
              <Text style={styles.headerTitle}>Batch {selectedBatch.batchId}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Batch Details Card */}
          <Text style={styles.detailsCardTitle}>Batch {selectedBatch.batchId}</Text>

          <View style={styles.detailsTableCard}>
            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Batch ID</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.batchId}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Unique batch code</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.uniqueBatchCode}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Crop and grade</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.cropGrade}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Warehouse</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.warehouse}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Storage location</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.storageLocation}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Received quantity</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.receivedQtyKg} kg</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Current quantity (from the ledger)</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.currentQtyKg} kg</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Allocated / reserved</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.allocatedReservedText}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Source goods receipt</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.sourceGoodsReceipt}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Linked purchase order</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.linkedPurchaseOrder}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Source farmer (internal traceability only)</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.sourceFarmer}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Received</Text>
              <Text style={styles.detailTableValBold}>{selectedBatch.receivedDate}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Batch status</Text>
              <View style={[styles.statusPill, styles.statusPillGreen]}>
                <Text style={[styles.statusPillText, styles.statusTextGreen]}>
                  {selectedBatch.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Related Stock Movements Section (Individual Cards matching Screenshot 4 Left) */}
          <Text style={[styles.detailsCardTitle, { marginTop: adminSpacing.lg }]}>
            Related stock movements
          </Text>

          {selectedBatch.relatedMovements.map((m) => (
            <View key={m.id} style={styles.relatedMoveCard}>
              <View style={styles.relatedMoveHeaderRow}>
                <Text style={styles.relatedMoveTitle}>
                  {m.type === 'Receipt' ? `MV-0001 · ${m.type}` : m.type === 'Sale' ? `MV-0009 · ${m.type}` : `MV-0014 · ${m.type}`}
                </Text>
                <Text
                  style={[
                    styles.relatedMoveAmount,
                    m.isPositive ? styles.amountPositive : styles.amountNegative,
                  ]}
                >
                  {m.amountText}
                </Text>
              </View>
              <Text style={styles.relatedMoveMeta}>{m.date} · {m.ref}</Text>
            </View>
          ))}

          <View style={{ height: adminSpacing.xxxl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // MAIN SCREEN: 3 TABS (Current stock | Batches | Ledger)
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <BackArrowWhiteIcon />
            <Text style={styles.headerTitle}>Stock Ledger & Batches</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 3-Tab Segmented Switcher (Matching Screenshot 1 & 3 & 4) ── */}
        <View style={styles.tabBarCard}>
          {(['Current stock', 'Batches', 'Ledger'] as TopTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabSegment, isSelected && styles.tabSegmentActive]}
                onPress={() => {
                  setActiveTab(tab);
                  setMovementTypeDropdownOpen(false);
                  setLedgerGradeDropdownOpen(false);
                  setWhDropdownOpen(false);
                  setGradeDropdownOpen(false);
                  setStatusDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabSegmentText, isSelected && styles.tabSegmentTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Search Bar with Right Filter Button (Matching Screenshot 1) ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.searchFilterBtn}
            onPress={openFilterModal}
            activeOpacity={0.7}
            accessibilityLabel="Open filters"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: CURRENT STOCK (Matching Screenshot 1)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Current stock' && (
          <View>
            <Text style={styles.recordsCountLabel}>
              {filteredCurrentStocks.length} Current stock
            </Text>

            {filteredCurrentStocks.map((item) => {
              const isInStock = item.status === 'In stock';
              const isLow = item.status === 'Low';
              return (
                <View key={item.id} style={styles.stockCard}>
                  {/* Card Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.stockCardTitle}>
                      {item.name}, {item.grade} · {item.warehouse}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        isInStock && styles.statusPillGreen,
                        isLow && styles.statusPillAmber,
                        item.status === 'Depleted' && styles.statusPillGray,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isInStock && styles.statusTextGreen,
                          isLow && styles.statusTextAmber,
                          item.status === 'Depleted' && styles.statusTextGray,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Subtitle */}
                  <Text style={styles.stockCardSubtitle}>
                    Location {item.locationCode} · On hand {item.onHandKg} kg
                  </Text>

                  {/* 3 Metrics Columns */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Allocated</Text>
                      <Text style={styles.metricValBold}>{item.allocatedKg} kg</Text>
                    </View>

                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Reserved</Text>
                      <Text style={styles.metricValBold}>{item.reservedKg} kg</Text>
                    </View>

                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Available</Text>
                      <Text style={[styles.metricValBold, styles.metricValGreen]}>
                        {item.availableKg} kg
                      </Text>
                    </View>
                  </View>

                  {/* Footer date */}
                  <Text style={styles.stockCardFooter}>
                    Last movement {item.lastMovement}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: BATCHES (Matching Screenshot 3)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Batches' && (
          <View>
            <Text style={styles.recordsCountLabel}>
              {filteredBatches.length} batches
            </Text>

            {filteredBatches.map((batch) => (
              <View key={batch.id} style={styles.stockCard}>
                {/* Header */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.stockCardTitle}>{batch.batchName}</Text>
                  <View style={[styles.statusPill, styles.statusPillGreen]}>
                    <Text style={[styles.statusPillText, styles.statusTextGreen]}>
                      {batch.status}
                    </Text>
                  </View>
                </View>

                {/* Subtitle info lines */}
                <Text style={styles.batchInfoLine}>Code {batch.uniqueBatchCode}</Text>
                <Text style={styles.batchInfoLine}>
                  {batch.warehouse.includes(',') ? batch.warehouse.split(',')[1]?.trim() : batch.warehouse} · {batch.storageLocation}
                </Text>
                <Text style={styles.batchInfoLine}>
                  Received {batch.receivedQtyKg} kg · Now {batch.currentQtyKg} kg (from the ledger)
                </Text>
                <Text style={styles.batchInfoLine}>Receipt {batch.sourceGoodsReceipt}</Text>

                {/* Action Link: View Batch Details */}
                <TouchableOpacity
                  style={styles.batchActionBtn}
                  onPress={() => setSelectedBatch(batch)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.batchActionLinkText}>View Batch Details</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: LEDGER (Matching Screenshot 4 Middle & New Screenshots)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'Ledger' && (
          <View>
            {/* Quick Filter Pill Button (Matching Image 1) */}
            <View style={styles.ledgerFilterRow}>
              <TouchableOpacity
                style={styles.movementTypeFilterPill}
                onPress={openFilterModal}
                activeOpacity={0.8}
              >
                <Text style={styles.movementTypeFilterPillText}>
                  {appliedMovementType === 'All' ? 'Movement type' : appliedMovementType}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.recordsCountLabel}>
              {filteredMovements.length} movements
            </Text>

            {filteredMovements.map((move) => {
              const whName = move.warehouse.includes(',') ? move.warehouse.split(',')[1]?.trim() : move.warehouse;
              return (
                <View key={move.id} style={styles.stockCard}>
                  {/* Header Row */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.stockCardTitle}>
                      {move.movementId} · {move.type}
                    </Text>
                    <View style={styles.amountPill}>
                      <Text style={styles.amountPillText}>{move.amountKg}</Text>
                    </View>
                  </View>

                  {/* Info Lines */}
                  <Text style={styles.batchInfoLine}>{move.date} · {move.performedBy}</Text>
                  <Text style={styles.batchInfoLine}>
                    {move.batchId} · {move.productGrade} · {whName}
                  </Text>
                  <Text style={styles.batchInfoLine}>Reference {move.reference}</Text>

                  {/* Action Links Row (Matching Screenshot 4 Middle) */}
                  <View style={styles.ledgerActionsRow}>
                    <TouchableOpacity
                      onPress={() => setSelectedMovement(move)}
                      activeOpacity={0.7}
                      style={styles.ledgerActionItem}
                    >
                      <Text style={styles.batchActionLinkText}>
                        {move.movementId === 'MV-0016' ? 'View Movement Details' : 'Movement Details'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenSourceRecord(move.reference)}
                      activeOpacity={0.7}
                      style={styles.ledgerActionItem}
                    >
                      <Text style={styles.batchActionLinkText}>Open Source Record</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════════════
          MOVEMENT DETAILS MODAL (Matching Screenshot 4 Right Bottom Sheet)
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedMovement}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMovement(null)}
      >
        <TouchableOpacity
          style={styles.movementModalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedMovement(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.movementSheetContent}>
            {selectedMovement && (
              <>
                <Text style={styles.sheetHeaderTitle}>
                  Movement {selectedMovement.movementId}
                </Text>

                <View style={styles.sheetTableCard}>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Movement ID</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.movementId}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Recorded (server time)</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.date}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Type</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.type}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Batch</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.batchId}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Product and grade</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.productGrade}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Warehouse</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.warehouse}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Quantity change</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.amountKg}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Reference</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.reference}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Performed by</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.performedBy}</Text>
                  </View>
                  <View style={styles.tableDivider} />

                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailTableLabel}>Reason</Text>
                    <Text style={styles.detailTableValBold}>{selectedMovement.reason ?? '—'}</Text>
                  </View>
                </View>

                {/* Lock Note */}
                <View style={styles.lockNoteBox}>
                  <LockNoteIcon size={16} color="#E65100" />
                  <Text style={styles.lockNoteText}>
                    A movement cannot be edited or deleted.
                  </Text>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setSelectedMovement(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════════
          SOURCE RECORD MODAL: TRANSFER TR-0002 (Matching Screenshot 1)
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedSourceTransfer}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSourceTransfer(null)}
      >
        <TouchableOpacity
          style={styles.movementModalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedSourceTransfer(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sourceSheetContent}>
            {selectedSourceTransfer && (
              <>
                <Text style={styles.sourceSheetTitle}>
                  Transfer {selectedSourceTransfer.transferId}
                </Text>

                <ScrollView showsVerticalScrollIndicator style={styles.sourceSheetScroll}>
                  {/* Details Card */}
                  <View style={styles.sourceDetailsCard}>
                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Transfer</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.transferId} · {selectedSourceTransfer.status}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>From, to</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.sourceWarehouse} to {selectedSourceTransfer.destWarehouse}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Product, grade, batch</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.product} · {selectedSourceTransfer.grade} · {selectedSourceTransfer.batchId}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Requested / dispatched</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.requestedKg} kg / {selectedSourceTransfer.dispatchedKg} kg
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Dispatch reference</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.dispatchRef}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Transport</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.transportText}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Received (physically)</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.receivedPhysically}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Damaged / missing / excess</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.damageMissingExcess}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Still expected</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.stillExpected}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Mismatch</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.mismatch}
                      </Text>
                    </View>
                    <View style={styles.tableDivider} />

                    <View style={styles.detailTableRow}>
                      <Text style={styles.detailTableLabel}>Reason</Text>
                      <Text style={styles.detailTableValBold}>
                        {selectedSourceTransfer.reason}
                      </Text>
                    </View>
                  </View>

                  {/* Timeline Section */}
                  <Text style={styles.sourceTimelineHeading}>Timeline</Text>

                  <View style={styles.sourceTimelineList}>
                    {selectedSourceTransfer.timeline.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        {idx > 0 && <View style={styles.timelineDivider} />}
                        <View style={styles.timelineItem}>
                          <Text style={styles.timelineMetaLine}>
                            {item.date} · {item.actor}
                          </Text>
                          <Text style={styles.timelineTitleBold}>{item.title}</Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </ScrollView>

                {/* Bottom Buttons: Receive at Destination & Close */}
                <View style={styles.sourceButtonsRow}>
                  <TouchableOpacity
                    style={styles.sourceReceiveBtn}
                    onPress={handleOpenReceiveModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sourceReceiveBtnText}>Receive at Destination</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sourceCloseBtn}
                    onPress={() => setSelectedSourceTransfer(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sourceCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════════
          RECEIVE AT DESTINATION MODAL (Matching Screenshots 2, 3, 4, 5)
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showReceiveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <TouchableOpacity
          style={styles.movementModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowReceiveModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sourceSheetContent}>
            <Text style={styles.sourceSheetTitle}>Receive at destination</Text>

            <ScrollView showsVerticalScrollIndicator style={styles.sourceSheetScroll}>
              {/* Info Card (Screenshot 2) */}
              <View style={styles.sourceDetailsCard}>
                <View style={styles.detailTableRow}>
                  <Text style={styles.detailTableLabel}>Sent</Text>
                  <Text style={styles.detailTableValBold}>50 kg</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailTableRow}>
                  <Text style={styles.detailTableLabel}>Already accounted for</Text>
                  <Text style={styles.detailTableValBold}>0 kg</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailTableRow}>
                  <Text style={styles.detailTableLabel}>Still expected</Text>
                  <Text style={styles.detailTableValBold}>50 kg</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailTableRow}>
                  <Text style={styles.detailTableLabel}>Expected product and grade</Text>
                  <Text style={styles.detailTableValBold}>Beans · Grade 1</Text>
                </View>
              </View>

              {/* Form Input: Received quantity (whole kg) * */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Received quantity (whole kg) *</Text>
                <TextInput
                  style={[
                    styles.formTextInput,
                    hasReceivedQtyError && styles.formTextInputError,
                  ]}
                  placeholder=""
                  keyboardType="numeric"
                  value={receiveQuantity}
                  onChangeText={(val) => {
                    setReceiveQuantity(val);
                    if (hasReceivedQtyError) setHasReceivedQtyError(false);
                  }}
                />
                {hasReceivedQtyError && (
                  <Text style={styles.formErrorSubtext}>
                    Record what was received, damaged or missing.
                  </Text>
                )}
              </View>

              {/* Dynamic feedback text (Screenshot 5) */}
              <Text style={styles.receiveCalcText}>
                Stock added: {receiveQuantity ? receiveQuantity : '0'} kg. Damaged {damagedQty || 0} kg and missing {missingQty || 0} kg are recorded, not stock. {Math.max(0, 50 - (Number(receiveQuantity) || 0))} kg would still be expected.
              </Text>

              {/* Form Input: Damaged or spoiled (part of received) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Damaged or spoiled (part of received)</Text>
                <TextInput
                  style={styles.formTextInput}
                  keyboardType="numeric"
                  value={damagedQty}
                  onChangeText={setDamagedQty}
                />
              </View>

              {/* Form Input: Missing */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Missing</Text>
                <TextInput
                  style={styles.formTextInput}
                  keyboardType="numeric"
                  value={missingQty}
                  onChangeText={setMissingQty}
                />
              </View>

              {/* Form Input: Excess found */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Excess found (recorded only, not added to stock)</Text>
                <TextInput
                  style={styles.formTextInput}
                  keyboardType="numeric"
                  value={excessQty}
                  onChangeText={setExcessQty}
                />
              </View>

              {/* Dropdown: Actual product */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Actual product</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    setReceiveGradeDropdownOpen(false);
                    setReceiveStorageDropdownOpen(false);
                    setReceiveProductDropdownOpen((p) => !p);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{actualProduct}</Text>
                  {receiveProductDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {receiveProductDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {['Beans', 'Tomato', 'Cabbage', 'Potato'].map((prod) => {
                      const isSel = actualProduct === prod;
                      return (
                        <TouchableOpacity
                          key={prod}
                          style={[styles.dropdownOption, isSel && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setActualProduct(prod);
                            setReceiveProductDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownOptionText, isSel && styles.dropdownOptionTextSelected]}>
                            {prod}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Dropdown: Actual grade */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Actual grade</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    setReceiveProductDropdownOpen(false);
                    setReceiveStorageDropdownOpen(false);
                    setReceiveGradeDropdownOpen((p) => !p);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{actualGrade}</Text>
                  {receiveGradeDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {receiveGradeDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {['Grade 1', 'Grade 2', 'Grade 3'].map((gr) => {
                      const isSel = actualGrade === gr;
                      return (
                        <TouchableOpacity
                          key={gr}
                          style={[styles.dropdownOption, isSel && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setActualGrade(gr);
                            setReceiveGradeDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownOptionText, isSel && styles.dropdownOptionTextSelected]}>
                            {gr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Dropdown: Storage location (Screenshot 5) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Storage location for the received stock</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    setReceiveProductDropdownOpen(false);
                    setReceiveGradeDropdownOpen(false);
                    setReceiveStorageDropdownOpen((p) => !p);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{storageLocation}</Text>
                  {receiveStorageDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {receiveStorageDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {['Select', 'Zone K'].map((loc) => {
                      const isSel = storageLocation === loc;
                      return (
                        <TouchableOpacity
                          key={loc}
                          style={[styles.dropdownOption, isSel && styles.dropdownOptionSelected]}
                          onPress={() => {
                            setStorageLocation(loc);
                            setReceiveStorageDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownOptionText, isSel && styles.dropdownOptionTextSelected]}>
                            {loc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Text Area: Mismatch reason */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Mismatch reason (damage, missing, excess or a different product or grade)
                </Text>
                <TextInput
                  style={styles.formTextArea}
                  multiline
                  numberOfLines={3}
                  value={mismatchReason}
                  onChangeText={setMismatchReason}
                />
              </View>

              {/* Text Area: Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={styles.formTextArea}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Validation Banner (Screenshot 4) */}
              {hasReceivedQtyError && (
                <View style={styles.errorBannerBox}>
                  <Text style={styles.errorBannerText}>Please correct the highlighted fields.</Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons: Record Receipt & Cancel */}
            <View style={styles.sourceButtonsRow}>
              <TouchableOpacity
                style={styles.sourceReceiveBtn}
                onPress={handleRecordReceipt}
                activeOpacity={0.8}
              >
                <Text style={styles.sourceReceiveBtnText}>Record Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sourceCloseBtn}
                onPress={() => setShowReceiveModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.sourceCloseBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════════
          SAVED SUCCESSFULLY CONFIRMATION MODAL
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showSuccessPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessPopup(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSuccessPopup(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckGreenIcon size={32} />
            </View>
            <Text style={styles.successTitle}>Saved successfully</Text>
            <Text style={styles.successSubtitle}>
              Goods receipt has been recorded and stock ledger updated.
            </Text>
            <TouchableOpacity
              style={styles.successOkBtn}
              onPress={() => setShowSuccessPopup(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.successOkBtnText}>OK</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════════
          FILTERS MODAL (Dynamically switches for Ledger vs Current/Batches)
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters</Text>

            {/* ── CASE A: LEDGER SECTION FILTERS (Matching New Screenshots 1, 2, 3) ── */}
            {activeTab === 'Ledger' ? (
              <>
                {/* 1. Movement type Dropdown (Matching Screenshot 1 & 2) */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Movement type</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      movementTypeDropdownOpen && styles.dropdownTriggerActive,
                    ]}
                    onPress={() => {
                      setMovementTypeDropdownOpen((prev) => !prev);
                      setLedgerGradeDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownTriggerText}>{draftMovementType}</Text>
                    {movementTypeDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                  </TouchableOpacity>

                  {movementTypeDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {(
                        [
                          'All',
                          'Receipt',
                          'Sale',
                          'Transfer out',
                          'Transfer in',
                          'Adjustment',
                        ] as MovementTypeFilter[]
                      ).map((type) => {
                        const isSelected = draftMovementType === type;
                        return (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.dropdownOption,
                              isSelected && styles.dropdownOptionSelected,
                            ]}
                            onPress={() => {
                              setDraftMovementType(type);
                              setMovementTypeDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownOptionText,
                                isSelected && styles.dropdownOptionTextSelected,
                              ]}
                            >
                              {type}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 2. Grade Dropdown (Matching Screenshot 1 & 3) */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Grade</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      ledgerGradeDropdownOpen && styles.dropdownTriggerActive,
                    ]}
                    onPress={() => {
                      setLedgerGradeDropdownOpen((prev) => !prev);
                      setMovementTypeDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownTriggerText}>{draftLedgerGrade}</Text>
                    {ledgerGradeDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                  </TouchableOpacity>

                  {ledgerGradeDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {(['All', 'Grade 1', 'Grade 2', 'Grade 3'] as GradeFilter[]).map((grade) => {
                        const isSelected = draftLedgerGrade === grade;
                        return (
                          <TouchableOpacity
                            key={grade}
                            style={[
                              styles.dropdownOption,
                              isSelected && styles.dropdownOptionSelected,
                            ]}
                            onPress={() => {
                              setDraftLedgerGrade(grade);
                              setLedgerGradeDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownOptionText,
                                isSelected && styles.dropdownOptionTextSelected,
                              ]}
                            >
                              {grade}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </>
            ) : (
              /* ── CASE B: CURRENT STOCK & BATCHES FILTERS ── */
              <>
                {/* 1. Warehouse Dropdown */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Warehouse</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      whDropdownOpen && styles.dropdownTriggerActive,
                    ]}
                    onPress={() => {
                      setWhDropdownOpen((prev) => !prev);
                      setGradeDropdownOpen(false);
                      setStatusDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownTriggerText}>{draftWarehouse}</Text>
                    {whDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                  </TouchableOpacity>

                  {whDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {(
                        [
                          'All Warehouses',
                          'Ooty',
                          'Coonoor',
                          'Kotagiri',
                          'Gudalur Market',
                        ] as WarehouseFilter[]
                      ).map((wh) => {
                        const isSelected = draftWarehouse === wh;
                        return (
                          <TouchableOpacity
                            key={wh}
                            style={[
                              styles.dropdownOption,
                              isSelected && styles.dropdownOptionSelected,
                            ]}
                            onPress={() => {
                              setDraftWarehouse(wh);
                              setWhDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownOptionText,
                                isSelected && styles.dropdownOptionTextSelected,
                              ]}
                            >
                              {wh}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 2. Grade Dropdown */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Grade</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      gradeDropdownOpen && styles.dropdownTriggerActive,
                    ]}
                    onPress={() => {
                      setGradeDropdownOpen((prev) => !prev);
                      setWhDropdownOpen(false);
                      setStatusDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownTriggerText}>{draftGrade}</Text>
                    {gradeDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                  </TouchableOpacity>

                  {gradeDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {(['All', 'Grade 1', 'Grade 2', 'Grade 3'] as GradeFilter[]).map((grade) => {
                        const isSelected = draftGrade === grade;
                        return (
                          <TouchableOpacity
                            key={grade}
                            style={[
                              styles.dropdownOption,
                              isSelected && styles.dropdownOptionSelected,
                            ]}
                            onPress={() => {
                              setDraftGrade(grade);
                              setGradeDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownOptionText,
                                isSelected && styles.dropdownOptionTextSelected,
                              ]}
                            >
                              {grade}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 3. Stock Status Dropdown */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Stock status</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      statusDropdownOpen && styles.dropdownTriggerActive,
                    ]}
                    onPress={() => {
                      setStatusDropdownOpen((prev) => !prev);
                      setWhDropdownOpen(false);
                      setGradeDropdownOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownTriggerText}>{draftStatus}</Text>
                    {statusDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                  </TouchableOpacity>

                  {statusDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {(['All', 'In stock', 'Low stock', 'Depleted'] as StockStatusFilter[]).map(
                        (status) => {
                          const isSelected = draftStatus === status;
                          return (
                            <TouchableOpacity
                              key={status}
                              style={[
                                styles.dropdownOption,
                                isSelected && styles.dropdownOptionSelected,
                              ]}
                              onPress={() => {
                                setDraftStatus(status);
                                setStatusDropdownOpen(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.dropdownOptionText,
                                  isSelected && styles.dropdownOptionTextSelected,
                                ]}
                              >
                                {status}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Action Buttons: Apply & Reset */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },

  // ── Segmented Switcher (Matching Screenshot 1 & 3 & 4) ──
  tabBarCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    padding: 4,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  tabSegment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabSegmentActive: {
    backgroundColor: adminColors.brand, // Brand orange highlight
  },
  tabSegmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A443F',
  },
  tabSegmentTextActive: {
    color: '#FFFFFF',
  },

  // ── Search Bar Container ──
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: adminColors.ink,
    marginLeft: 8,
    paddingVertical: 0,
  },
  searchFilterBtn: {
    padding: 6,
  },

  recordsCountLabel: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
    marginTop: 2,
  },

  // ── Ledger Specific Quick Filter Pill (Matching Screenshot 3 Background) ──
  ledgerFilterRow: {
    marginBottom: adminSpacing.sm,
  },
  movementTypeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    ...adminShadow.sm,
  },
  movementTypeFilterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C3818',
  },

  // ── Current Stock & Batches Cards ──
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  statusPillGreen: {
    backgroundColor: '#E8F5E9',
  },
  statusTextGreen: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 11,
  },
  statusPillAmber: {
    backgroundColor: '#FFF3E0',
  },
  statusTextAmber: {
    color: '#B25E00',
    fontWeight: '700',
    fontSize: 11,
  },
  statusPillGray: {
    backgroundColor: '#F5F5F5',
  },
  statusTextGray: {
    color: '#757575',
    fontWeight: '700',
    fontSize: 11,
  },
  statusPillText: {
    fontSize: 11,
  },
  stockCardSubtitle: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 2,
  },
  metricValBold: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  metricValGreen: {
    color: '#2E7D32',
  },
  stockCardFooter: {
    fontSize: 11,
    color: adminColors.muted,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEA',
    paddingTop: 8,
  },

  // ── Batches Tab Card Specifics ──
  batchInfoLine: {
    fontSize: 12,
    color: '#4A443F',
    lineHeight: 18,
    marginBottom: 2,
  },
  batchActionBtn: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEA',
  },
  batchActionLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A3205',
  },

  // ── Ledger Tab Card Specifics ──
  amountPill: {
    backgroundColor: '#F5F2EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1412',
  },
  ledgerActionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEA',
  },
  ledgerActionItem: {
    paddingVertical: 2,
  },

  // ── Batch Details Screen Styles (Screenshot 4 Left) ──
  detailsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A3525',
    marginBottom: 10,
  },
  detailsTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...adminShadow.sm,
  },
  detailTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailTableLabel: {
    fontSize: 13,
    color: adminColors.muted,
    flex: 1,
  },
  detailTableValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1412',
    textAlign: 'right',
    flex: 1.2,
  },
  tableDivider: {
    height: 1,
    backgroundColor: '#F4EFEA',
  },
  relatedMoveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  relatedMoveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  relatedMoveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1412',
  },
  relatedMoveMeta: {
    fontSize: 12,
    color: adminColors.muted,
  },
  relatedMoveAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  amountPositive: {
    color: '#2E7D32',
  },
  amountNegative: {
    color: '#1A1412',
  },

  // ── Movement Details Bottom Sheet (Screenshot 4 Right) ──
  movementModalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  movementSheetContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '90%',
    ...adminShadow.md,
  },
  sheetHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1412',
    marginBottom: 16,
  },
  sheetTableCard: {
    borderWidth: 1,
    borderColor: '#F0ECE6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  lockNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  lockNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    flex: 1,
  },
  sheetCloseBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A3525',
  },

  // ── Filters Modal Styles (Matching Screenshots 1, 2, 3) ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...adminShadow.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1412',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A443F',
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownTriggerActive: {
    borderColor: '#1A1412', // Darker focused border matching Screenshot 1
    borderWidth: 1.8,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: '#1A1412',
    fontWeight: '500',
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#707070',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownOption: {
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  dropdownOptionSelected: {
    backgroundColor: '#707070', // Dark grey background for selected option matching Screenshot 2 & 3
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#1A1412',
  },
  dropdownOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Modal Buttons
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1412',
  },
  modalResetBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1412',
  },

  // ── Source Transfer Sheet & Receive at Destination Styles (Screenshots 1-5) ──
  sourceSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '88%',
    width: '100%',
    ...adminShadow.lg,
  },
  sourceSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1412',
    marginBottom: 14,
  },
  sourceSheetScroll: {
    maxHeight: 520,
  },
  sourceDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBE4',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  sourceTimelineHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A3205',
    marginBottom: 8,
  },
  sourceTimelineList: {
    marginBottom: 14,
  },
  sourceButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  sourceReceiveBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  sourceReceiveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C3818',
  },
  sourceCloseBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  sourceCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C3818',
  },

  // Form styles for Receive at Destination
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A3525',
    marginBottom: 6,
  },
  formTextInput: {
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#1A1412',
  },
  formTextInputError: {
    borderColor: '#D32F2F',
    borderWidth: 1.8,
  },
  formErrorSubtext: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  receiveCalcText: {
    fontSize: 12,
    color: '#707070',
    lineHeight: 18,
    marginBottom: 12,
  },
  formTextArea: {
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    color: '#1A1412',
    minHeight: 64,
    textAlignVertical: 'top',
  },
  errorBannerBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 10,
  },
  errorBannerText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '700',
  },
  timelineDivider: {
    height: 1,
    backgroundColor: '#E8E1D7',
    marginVertical: 10,
  },
  timelineItem: {
    paddingVertical: 4,
  },
  timelineMetaLine: {
    fontSize: 12,
    color: '#8A8480',
    marginBottom: 4,
  },
  timelineTitleBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1412',
  },

  // Success Card Modal
  successCard: {
    width: '84%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1412',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#605853',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successOkBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  successOkBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
