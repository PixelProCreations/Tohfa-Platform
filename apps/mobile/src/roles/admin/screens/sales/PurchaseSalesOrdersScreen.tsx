import React, { useState, useMemo } from 'react';
import {
  Alert,
  Modal,
  Platform,
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
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { OverviewDashboardCard } from '../../components';
import { PurchaseOrderDetailScreen } from './PurchaseOrderDetailScreen';
import { PurchaseOrderReceiptScreen } from './PurchaseOrderReceiptScreen';
import { PurchaseOrderPayoutScreen } from './PurchaseOrderPayoutScreen';
import { SalesOrderDetailScreen, type SalesOrderRecord } from './SalesOrderDetailScreen';
import { InvoiceDetailScreen, type InvoiceDetailData } from '../finance/InvoiceDetailScreen';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#786F68' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = '#2D1802' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = '#786F68' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="14" r="1.1" fill={color} />
      <Circle cx="12" cy="14" r="1.1" fill={color} />
      <Circle cx="16" cy="14" r="1.1" fill={color} />
      <Circle cx="8" cy="18" r="1.1" fill={color} />
      <Circle cx="12" cy="18" r="1.1" fill={color} />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = '#1F1714' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#1F1714' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = '#786F68' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface PurchaseOrderRecord {
  id: string;
  poNumber: string;
  listingCode: string;
  farmerName: string;
  produceName: string;
  grade: string;
  quantityKg: number;
  unitPrice: number;
  totalPrice: number;
  warehouse: string;
  dateStr: string;
  purchaseStatus: 'Closed' | 'Open' | 'Receipt in progress';
  receiptStatus: 'Completed' | 'Partial' | 'Not received';
  payoutId?: string;
  farmerId?: string;
  goodsReceiptId?: string;
  payoutStatus?: string;
}

const PURCHASE_ORDERS_DATA: PurchaseOrderRecord[] = [
  {
    id: 'po-1',
    poNumber: 'PO-0009',
    listingCode: 'LST-2909',
    farmerName: 'Kumar',
    produceName: 'Beans',
    grade: 'Grade 2',
    quantityKg: 60,
    unitPrice: 55,
    totalPrice: 3300,
    warehouse: 'Main Warehouse, Ooty',
    dateStr: '30 Sep 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-2',
    poNumber: 'PO-0008',
    listingCode: 'LST-2908',
    farmerName: 'Meena',
    produceName: 'Carrot',
    grade: 'Grade 2',
    quantityKg: 90,
    unitPrice: 35,
    totalPrice: 3150,
    warehouse: 'Sub Warehouse, Coonoor',
    dateStr: '24 Sep 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-3',
    poNumber: 'PO-0007',
    listingCode: 'LST-2907',
    farmerName: 'Ramesh Kumar',
    produceName: 'Tomato',
    grade: 'Grade 2',
    quantityKg: 120,
    unitPrice: 36,
    totalPrice: 4320,
    warehouse: 'Sub Warehouse, Coonoor',
    dateStr: '8 Oct 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-4',
    poNumber: 'PO-0006',
    listingCode: 'LST-2906',
    farmerName: 'Senthil',
    produceName: 'Garlic',
    grade: 'Grade 1',
    quantityKg: 80,
    unitPrice: 110,
    totalPrice: 8800,
    warehouse: 'Main Warehouse, Ooty',
    dateStr: '10 Oct 2026',
    purchaseStatus: 'Receipt in progress',
    receiptStatus: 'Partial',
  },
  {
    id: 'po-5',
    poNumber: 'PO-0005',
    listingCode: 'LST-2905',
    farmerName: 'Vijay',
    produceName: 'Potato',
    grade: 'Grade 1',
    quantityKg: 250,
    unitPrice: 25,
    totalPrice: 6250,
    warehouse: 'Sub Warehouse, Kotagiri',
    dateStr: '12 Oct 2026',
    purchaseStatus: 'Open',
    receiptStatus: 'Not received',
  },
  {
    id: 'po-6',
    poNumber: 'PO-0004',
    listingCode: 'LST-2904',
    farmerName: 'Meena',
    produceName: 'Carrot',
    grade: 'Grade 1',
    quantityKg: 100,
    unitPrice: 40,
    totalPrice: 4000,
    warehouse: 'Main Warehouse, Ooty',
    dateStr: '11 Oct 2026',
    purchaseStatus: 'Receipt in progress',
    receiptStatus: 'Partial',
  },
  {
    id: 'po-7',
    poNumber: 'PO-0003',
    listingCode: 'LST-2903',
    farmerName: 'Selvi',
    produceName: 'Cabbage',
    grade: 'Grade 1',
    quantityKg: 150,
    unitPrice: 20,
    totalPrice: 3000,
    warehouse: 'Sub Warehouse, Coonoor',
    dateStr: '4 Oct 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
];

// ─── Filter Options (Strictly matching user screenshots) ────────────────────

const FARMER_OPTIONS = ['All', 'Direct', 'Online', 'HORECA', 'Option 5'];
const PRODUCT_OPTIONS = ['All', 'Carrot', 'Beans', 'Cabbage', 'Tomato', 'Potato'];
const WAREHOUSE_OPTIONS = ['Select...', 'Ooty', 'Coonoor', 'Kotagiri'];
const PURCHASE_STATUS_OPTIONS = ['All', 'Purchase', 'Sales'];
const RECEIPT_STATUS_OPTIONS = ['All', 'Purchase', 'Sales'];

// ─── Sales Orders Data (11 orders matching user screenshots) ─────────────────

const SALES_ORDERS_DATA: SalesOrderRecord[] = [
  {
    id: 'so-1',
    soNumber: 'SO-0004',
    customerName: 'Demo Hotel Pvt Ltd',
    customerId: 'C-1004',
    channel: 'HORECA',
    status: 'In fulfilment',
    itemCount: 2,
    totalPrice: 3700.0,
    paymentStatus: 'Paid',
    warehouse: 'WH-MAIN',
    subMeta: 'WH-MAIN · Invoice Draft',
    dateTime: '11 Oct 2026, 09:15',
    paymentRef: 'PAY-7004',
    itemName: 'Tomato',
    itemGrade: 'Grade 1',
    itemQty: 100,
    itemUnitPrice: 37.0,
    fulfilledQty: 60,
    remainingQty: 40,
    fulfilmentStatus: 'In fulfilment',
  },
  {
    id: 'so-2',
    soNumber: 'SO-0011',
    customerName: 'Demo Customer E',
    customerId: 'C-1005',
    channel: 'Online',
    status: 'Issue',
    itemCount: 1,
    totalPrice: 280.0,
    paymentStatus: 'Paid',
    warehouse: 'Main Warehouse, Ooty',
    subMeta: 'Delivery attempt failed (demo)',
    dateTime: '11 Oct 2026, 10:00',
    paymentRef: 'PAY-7012',
    itemName: 'Garlic',
    itemGrade: 'Grade 1',
    itemQty: 2,
    itemUnitPrice: 140.0,
    fulfilledQty: 0,
    remainingQty: 2,
    fulfilmentStatus: 'Issue',
    exceptionNote: 'Delivery attempt failed (demo).',
  },
  {
    id: 'so-3',
    soNumber: 'SO-0005',
    customerName: 'Demo Traders LLP',
    customerId: 'C-1002',
    channel: 'B2B',
    status: 'Completed',
    itemCount: 2,
    totalPrice: 7400.0,
    paymentStatus: 'Paid',
    warehouse: 'WH-MAIN',
    subMeta: 'WH-MAIN · Invoice Issued (INV-2026-0001)',
    dateTime: '10 Oct 2026, 14:30',
    paymentRef: 'PAY-7005',
    invoiceRef: 'INV-2026-0001',
    itemName: 'Carrot',
    itemGrade: 'Grade 2',
    itemQty: 200,
    itemUnitPrice: 37.0,
    fulfilledQty: 200,
    remainingQty: 0,
    fulfilmentStatus: 'Completed',
  },
  {
    id: 'so-4',
    soNumber: 'SO-0001',
    customerName: 'Priya Sharma',
    customerId: 'C-1001',
    channel: 'Online',
    status: 'Completed',
    itemCount: 3,
    totalPrice: 620.0,
    paymentStatus: 'Paid',
    warehouse: 'Main Warehouse, Ooty',
    subMeta: 'Delivered successfully',
    dateTime: '9 Oct 2026, 11:20',
    paymentRef: 'PAY-7001',
    itemName: 'Beans',
    itemGrade: 'Grade 1',
    itemQty: 5,
    itemUnitPrice: 60.0,
    fulfilledQty: 5,
    remainingQty: 0,
    fulfilmentStatus: 'Completed',
  },
  {
    id: 'so-5',
    soNumber: 'SO-0002',
    customerName: 'Rajesh Kannan',
    customerId: 'C-1003',
    channel: 'Online',
    status: 'In fulfilment',
    itemCount: 1,
    totalPrice: 350.0,
    paymentStatus: 'Paid',
    warehouse: 'Sub Warehouse, Coonoor',
    subMeta: 'Packed · Ready for dispatch',
    dateTime: '11 Oct 2026, 08:45',
    paymentRef: 'PAY-7002',
    itemName: 'Potato',
    itemGrade: 'Grade 1',
    itemQty: 10,
    itemUnitPrice: 35.0,
    fulfilledQty: 10,
    remainingQty: 0,
    fulfilmentStatus: 'In fulfilment',
  },
  {
    id: 'so-6',
    soNumber: 'SO-0003',
    customerName: 'Green Valley Veggies',
    customerId: 'C-1006',
    channel: 'Market',
    status: 'Completed',
    itemCount: 4,
    totalPrice: 4200.0,
    paymentStatus: 'Paid',
    warehouse: 'Main Warehouse, Ooty',
    subMeta: 'Cash collection reconciled',
    dateTime: '8 Oct 2026, 07:30',
    paymentRef: 'PAY-7003',
    itemName: 'Cabbage',
    itemGrade: 'Grade 1',
    itemQty: 150,
    itemUnitPrice: 28.0,
    fulfilledQty: 150,
    remainingQty: 0,
    fulfilmentStatus: 'Completed',
  },
  {
    id: 'so-7',
    soNumber: 'SO-0006',
    customerName: 'Apex Organic Retails',
    customerId: 'C-1007',
    channel: 'B2B',
    status: 'In fulfilment',
    itemCount: 3,
    totalPrice: 11200.0,
    paymentStatus: 'Paid',
    warehouse: 'WH-MAIN',
    subMeta: 'WH-MAIN · Invoice Draft',
    dateTime: '11 Oct 2026, 09:00',
    paymentRef: 'PAY-7006',
    itemName: 'Beans',
    itemGrade: 'Grade 1',
    itemQty: 160,
    itemUnitPrice: 70.0,
    fulfilledQty: 100,
    remainingQty: 60,
    fulfilmentStatus: 'In fulfilment',
  },
  {
    id: 'so-8',
    soNumber: 'SO-0007',
    customerName: 'Grand Nilgiris Resort',
    customerId: 'C-1008',
    channel: 'HORECA',
    status: 'Completed',
    itemCount: 5,
    totalPrice: 8900.0,
    paymentStatus: 'Paid',
    warehouse: 'WH-MAIN',
    subMeta: 'Delivered · Invoice Settled',
    dateTime: '7 Oct 2026, 06:15',
    paymentRef: 'PAY-7007',
    itemName: 'Tomato',
    itemGrade: 'Grade 1',
    itemQty: 200,
    itemUnitPrice: 44.5,
    fulfilledQty: 200,
    remainingQty: 0,
    fulfilmentStatus: 'Completed',
  },
  {
    id: 'so-9',
    soNumber: 'SO-0008',
    customerName: 'Kavitha S.',
    customerId: 'C-1009',
    channel: 'Online',
    status: 'Completed',
    itemCount: 2,
    totalPrice: 480.0,
    paymentStatus: 'Paid',
    warehouse: 'Main Warehouse, Ooty',
    subMeta: 'Delivered successfully',
    dateTime: '6 Oct 2026, 15:40',
    paymentRef: 'PAY-7008',
    itemName: 'Carrot',
    itemGrade: 'Grade 1',
    itemQty: 8,
    itemUnitPrice: 60.0,
    fulfilledQty: 8,
    remainingQty: 0,
    fulfilmentStatus: 'Completed',
  },
  {
    id: 'so-10',
    soNumber: 'SO-0009',
    customerName: 'Ooty Farmers Market Booth 4',
    customerId: 'C-1010',
    channel: 'Market',
    status: 'Completed',
    itemCount: 2,
    totalPrice: 3100.0,
    paymentStatus: 'Paid',
    warehouse: 'Sub Warehouse, Kotagiri',
    subMeta: 'Market Day settlement',
    dateTime: '5 Oct 2026, 12:00',
    paymentRef: 'PAY-7009',
    itemName: 'Potato',
    itemGrade: 'Grade 2',
    itemQty: 100,
    itemUnitPrice: 31.0,
    fulfilledQty: 100,
    remainingQty: 0,
    fulfilmentStatus: 'Completed',
  },
  {
    id: 'so-11',
    soNumber: 'SO-0010',
    customerName: 'Highland Supermarket',
    customerId: 'C-1011',
    channel: 'B2B',
    status: 'Completed',
    itemCount: 4,
    totalPrice: 15400.0,
    paymentStatus: 'Paid',
    warehouse: 'WH-MAIN',
    subMeta: 'WH-MAIN · Invoice Issued (INV-2026-0002)',
    dateTime: '4 Oct 2026, 16:50',
    paymentRef: 'PAY-7010',
    invoiceRef: 'INV-2026-0002',
    itemName: 'Garlic',
    itemGrade: 'Grade 1',
    itemQty: 110,
    itemUnitPrice: 140.0,
    fulfilledQty: 110,
    remainingQty: 0,
    fulfilmentStatus: 'Completed',
  },
];

export interface PurchaseSalesOrdersScreenProps {
  onBack: () => void;
  onNavigateOrder?: (orderId: string) => void;
}

export function PurchaseSalesOrdersScreen({ onBack, onNavigateOrder }: PurchaseSalesOrdersScreenProps) {
  // Tabs: 'Purchase' | 'Sales'
  const [activeTab, setActiveTab] = useState<'Purchase' | 'Sales'>('Purchase');

  // Subscreen navigation: 'list' | 'detail' | 'receipt' | 'payout' | 'salesDetail' | 'invoiceDetail'
  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail' | 'receipt' | 'payout' | 'salesDetail' | 'invoiceDetail'>('list');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderRecord>(PURCHASE_ORDERS_DATA[0]!);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrderRecord>(SALES_ORDERS_DATA[1]!);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailData | null>(null);
  const [selectedSalesChannel, setSelectedSalesChannel] = useState<'All' | 'Online' | 'Market' | 'B2B' | 'HORECA'>('All');
  const [receiptPreviousScreen, setReceiptPreviousScreen] = useState<'list' | 'detail'>('list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Filter form values
  const [selectedFarmer, setSelectedFarmer] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('Select...');
  const [selectedDateAfter, setSelectedDateAfter] = useState('dd-mm-yyyy');
  const [selectedPurchaseStatus, setSelectedPurchaseStatus] = useState('All');
  const [selectedReceiptStatus, setSelectedReceiptStatus] = useState('All');

  // Active dropdown picker sheet inside modal
  const [activePicker, setActivePicker] = useState<
    'farmer' | 'product' | 'warehouse' | 'purchaseStatus' | 'receiptStatus' | null
  >(null);

  // Calendar State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(8); // September (0-indexed)
  const [tempSelectedDay, setTempSelectedDay] = useState(24);

  const handleApplyDate = () => {
    const d = String(tempSelectedDay).padStart(2, '0');
    const m = String(calMonth + 1).padStart(2, '0');
    setSelectedDateAfter(`${d}-${m}-${calYear}`);
    setShowCalendarModal(false);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    farmer: 'All',
    product: 'All',
    warehouse: 'Select...',
    purchaseStatus: 'All',
    receiptStatus: 'All',
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      farmer: selectedFarmer,
      product: selectedProduct,
      warehouse: selectedWarehouse,
      purchaseStatus: selectedPurchaseStatus,
      receiptStatus: selectedReceiptStatus,
    });
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedFarmer('All');
    setSelectedProduct('All');
    setSelectedWarehouse('Select...');
    setSelectedDateAfter('dd-mm-yyyy');
    setSelectedPurchaseStatus('All');
    setSelectedReceiptStatus('All');
    setAppliedFilters({
      farmer: 'All',
      product: 'All',
      warehouse: 'Select...',
      purchaseStatus: 'All',
      receiptStatus: 'All',
    });
    setSearchQuery('');
    setIsFilterModalOpen(false);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return PURCHASE_ORDERS_DATA.filter((po) => {
      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          po.poNumber.toLowerCase().includes(q) ||
          po.farmerName.toLowerCase().includes(q) ||
          po.produceName.toLowerCase().includes(q) ||
          po.warehouse.toLowerCase().includes(q) ||
          po.listingCode.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Applied filters check
      if (appliedFilters.farmer !== 'All') {
        const f = appliedFilters.farmer.toLowerCase();
        const matchesFarmer =
          po.farmerName.toLowerCase().includes(f) ||
          (appliedFilters.farmer === 'Direct' && (po.id === '1' || po.id === '3')) ||
          (appliedFilters.farmer === 'Online' && (po.id === '2' || po.id === '4')) ||
          (appliedFilters.farmer === 'HORECA' && (po.id === '5' || po.id === '6')) ||
          (appliedFilters.farmer === 'Option 5' && po.id === '7');
        if (!matchesFarmer) return false;
      }
      if (appliedFilters.product !== 'All') {
        if (po.produceName.toLowerCase() !== appliedFilters.product.toLowerCase()) {
          return false;
        }
      }
      if (appliedFilters.warehouse !== 'Select...') {
        if (!po.warehouse.toLowerCase().includes(appliedFilters.warehouse.toLowerCase())) {
          return false;
        }
      }
      if (appliedFilters.purchaseStatus !== 'All') {
        // 'Purchase' or 'Sales' filter
        if (appliedFilters.purchaseStatus === 'Sales') return false;
      }
      if (appliedFilters.receiptStatus !== 'All') {
        if (appliedFilters.receiptStatus === 'Sales') return false;
      }

      return true;
    });
  }, [searchQuery, appliedFilters]);

  // Filtered sales orders list
  const channelCounts = useMemo(() => {
    return {
      all: SALES_ORDERS_DATA.length,
      online: SALES_ORDERS_DATA.filter((s) => s.channel === 'Online').length,
      market: SALES_ORDERS_DATA.filter((s) => s.channel === 'Market').length,
      b2b: SALES_ORDERS_DATA.filter((s) => s.channel === 'B2B').length,
      horeca: SALES_ORDERS_DATA.filter((s) => s.channel === 'HORECA').length,
    };
  }, []);

  const filteredSalesOrders = useMemo(() => {
    return SALES_ORDERS_DATA.filter((so) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          so.soNumber.toLowerCase().includes(q) ||
          so.customerName.toLowerCase().includes(q) ||
          so.channel.toLowerCase().includes(q) ||
          so.warehouse.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedSalesChannel !== 'All') {
        if (so.channel !== selectedSalesChannel) return false;
      }
      return true;
    });
  }, [searchQuery, selectedSalesChannel]);

  // Action handlers
  const handleViewPO = (po: PurchaseOrderRecord) => {
    setSelectedOrder(po);
    setCurrentScreen('detail');
  };

  const handleOpenReceipt = (po: PurchaseOrderRecord) => {
    setSelectedOrder(po);
    setReceiptPreviousScreen('list');
    setCurrentScreen('receipt');
  };

  const handleOpenReceiptFromDetail = () => {
    setReceiptPreviousScreen('detail');
    setCurrentScreen('receipt');
  };

  const handleViewPayout = (po: PurchaseOrderRecord) => {
    setSelectedOrder(po);
    setCurrentScreen('payout');
  };

  const handleViewSalesOrder = (so: SalesOrderRecord) => {
    setSelectedSalesOrder(so);
    setCurrentScreen('salesDetail');
  };

  const handleViewInvoice = (so: SalesOrderRecord) => {
    const invNumber = so.invoiceRef && so.invoiceRef !== '—' ? so.invoiceRef : `INV-${so.soNumber}`;
    const invData: InvoiceDetailData = {
      id: `inv-${so.id}`,
      invoiceNumber: invNumber,
      status: so.status === 'Completed' ? 'Issued' : 'Draft',
      dateStr: so.dateTime ? so.dateTime.split(',')[0]! : '12 Oct 2026',
      soNumber: so.soNumber,
      recipient: `${so.customerName} (${so.customerId})`,
      billingAddress: 'Main Warehouse, Ooty',
      gstin: '33AABCT1234D1Z5',
      itemName: so.itemName,
      itemGrade: so.itemGrade,
      itemRate: `${so.itemQty} kg × ₹${so.itemUnitPrice.toFixed(2)}/kg`,
      itemTotal: `₹${so.totalPrice.toFixed(2)}`,
      taxableAmount: `₹${so.totalPrice.toFixed(2)}`,
      taxText: 'Included: 5% GST',
      finalAmountText: `₹${so.totalPrice.toFixed(2)}`,
      historyEvents: [
        {
          date: `${so.dateTime} · System`,
          title: `Invoice ${so.status === 'Completed' ? 'issued' : 'draft'}: ${invNumber}`,
        },
      ],
    };
    setSelectedInvoice(invData);
    setCurrentScreen('invoiceDetail');
  };

  if (currentScreen === 'detail') {
    return (
      <PurchaseOrderDetailScreen
        order={selectedOrder}
        onBack={() => setCurrentScreen('list')}
        onOpenReceipt={handleOpenReceiptFromDetail}
      />
    );
  }

  if (currentScreen === 'receipt') {
    return (
      <PurchaseOrderReceiptScreen
        order={selectedOrder}
        onBack={() => setCurrentScreen(receiptPreviousScreen)}
      />
    );
  }

  if (currentScreen === 'payout') {
    return (
      <PurchaseOrderPayoutScreen
        order={selectedOrder}
        onBack={() => setCurrentScreen('list')}
      />
    );
  }

  if (currentScreen === 'salesDetail') {
    return (
      <SalesOrderDetailScreen
        order={selectedSalesOrder}
        onBack={() => setCurrentScreen('list')}
      />
    );
  }

  if (currentScreen === 'invoiceDetail' && selectedInvoice) {
    return (
      <InvoiceDetailScreen
        invoice={selectedInvoice}
        onBack={() => setCurrentScreen('list')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── 1. Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Accounts & Finance"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase & Sales Orders</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 2. Top Stats: 8 KPI Cards (Reusing OverviewDashboardCard) ── */}
        <View style={styles.kpiGrid}>
          <OverviewDashboardCard
            value="9"
            title="Purchase Orders"
            titlePosition="bottom"
            preserveCase
            style={styles.kpiCard}
            valueStyle={styles.kpiValue}
            titleStyle={styles.kpiTitle}
          />
          <OverviewDashboardCard
            value="11"
            title="Sales Orders"
            titlePosition="bottom"
            preserveCase
            style={styles.kpiCard}
            valueStyle={styles.kpiValue}
            titleStyle={styles.kpiTitle}
          />
          <OverviewDashboardCard
            value="1"
            title="Receipts Awaiting Inspection"
            titlePosition="bottom"
            preserveCase
            style={styles.kpiCard}
            valueStyle={styles.kpiValue}
            titleStyle={styles.kpiTitle}
          />
          <OverviewDashboardCard
            value="2"
            title="Quality Issues / Rejected"
            titlePosition="bottom"
            preserveCase
            style={styles.kpiCard}
            valueStyle={styles.kpiValue}
            titleStyle={styles.kpiTitle}
          />
          <OverviewDashboardCard
            value="3"
            title="Orders Awaiting Fulfilment"
            titlePosition="bottom"
            preserveCase
            style={styles.kpiCard}
            valueStyle={styles.kpiValue}
            titleStyle={styles.kpiTitle}
          />
          <OverviewDashboardCard
            value="1"
            title="Invoices Pending Action"
            titlePosition="bottom"
            preserveCase
            style={styles.kpiCard}
            valueStyle={styles.kpiValue}
            titleStyle={styles.kpiTitle}
          />
          <OverviewDashboardCard
            value="2"
            title="Open Returns / RMA"
            titlePosition="bottom"
            preserveCase
            style={styles.kpiCard}
            valueStyle={styles.kpiValue}
            titleStyle={styles.kpiTitle}
          />
          <OverviewDashboardCard
            value="3"
            title="Farmer Payouts Pending"
            titlePosition="bottom"
            preserveCase
            style={styles.kpiCard}
            valueStyle={styles.kpiValue}
            titleStyle={styles.kpiTitle}
          />
        </View>

        {/* ── 3. Segmented Toggle (Purchase | Sales) ── */}
        <View style={styles.segmentedToggleContainer}>
          <TouchableOpacity
            style={[
              styles.segmentedTab,
              activeTab === 'Purchase' && styles.segmentedTabActive,
            ]}
            onPress={() => setActiveTab('Purchase')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Purchase' }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                activeTab === 'Purchase' && styles.segmentedTabTextActive,
              ]}
            >
              Purchase
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentedTab,
              activeTab === 'Sales' && styles.segmentedTabActive,
            ]}
            onPress={() => setActiveTab('Sales')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'Sales' }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                activeTab === 'Sales' && styles.segmentedTabTextActive,
              ]}
            >
              Sales
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. Search & Filter Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color="#786F68" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#786F68"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setIsFilterModalOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Open Filters"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── 5. Results Counter & Tab Content ── */}
        {activeTab === 'Purchase' ? (
          <>
            <Text style={styles.counterText}>
              {filteredOrders.length} of {PURCHASE_ORDERS_DATA.length} purchase orders
            </Text>

            {/* Purchase Orders Cards List */}
            {filteredOrders.map((po) => {
              const isClosed = po.purchaseStatus === 'Closed';
              const isReceiptInProgress = po.purchaseStatus === 'Receipt in progress';

              return (
                <View key={po.id} style={styles.poCard}>
                  <View style={styles.poCardHeaderRow}>
                    <Text style={styles.poNumber}>{po.poNumber}</Text>
                    <View style={styles.badgesRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          isClosed
                            ? styles.badgeGreen
                            : isReceiptInProgress
                            ? styles.badgeAmber
                            : styles.badgeGray,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isClosed
                              ? styles.badgeTextGreen
                              : isReceiptInProgress
                              ? styles.badgeTextAmber
                              : styles.badgeTextGray,
                          ]}
                        >
                          {po.purchaseStatus}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          po.receiptStatus === 'Completed'
                            ? styles.badgeGreen
                            : styles.badgeAmber,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            po.receiptStatus === 'Completed'
                              ? styles.badgeTextGreen
                              : styles.badgeTextAmber,
                          ]}
                        >
                          {po.receiptStatus}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.poDetailLine}>
                    Listing {po.listingCode} · {po.farmerName}
                  </Text>
                  <Text style={styles.poDetailLine}>
                    {po.produceName} · {po.grade} · {po.quantityKg} kg
                  </Text>
                  <Text style={styles.poDetailLine}>
                    Unit price ₹{po.unitPrice.toFixed(2)}/kg · Total ₹
                    {po.totalPrice.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text style={styles.poDetailLine}>
                    {po.warehouse} · {po.dateStr}
                  </Text>

                  <View style={styles.poActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleViewPO(po)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={styles.poActionText}>View PO</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenReceipt(po)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={styles.poActionText}>Open Receipt</Text>
                    </TouchableOpacity>

                    {isClosed && (
                      <TouchableOpacity
                        onPress={() => handleViewPayout(po)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      >
                        <Text style={styles.poActionText}>View Payout</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            <Text style={styles.counterText}>
              {filteredSalesOrders.length} orders
            </Text>

            {/* Horizontal Channel Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.channelPillsScroll}
            >
              <TouchableOpacity
                style={[
                  styles.channelPill,
                  selectedSalesChannel === 'All' && styles.channelPillActive,
                ]}
                onPress={() => setSelectedSalesChannel('All')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.channelPillText,
                    selectedSalesChannel === 'All' && styles.channelPillTextActive,
                  ]}
                >
                  All {channelCounts.all}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.channelPill,
                  selectedSalesChannel === 'Online' && styles.channelPillActive,
                ]}
                onPress={() => setSelectedSalesChannel('Online')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.channelPillText,
                    selectedSalesChannel === 'Online' && styles.channelPillTextActive,
                  ]}
                >
                  Online {channelCounts.online}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.channelPill,
                  selectedSalesChannel === 'Market' && styles.channelPillActive,
                ]}
                onPress={() => setSelectedSalesChannel('Market')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.channelPillText,
                    selectedSalesChannel === 'Market' && styles.channelPillTextActive,
                  ]}
                >
                  Market {channelCounts.market}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.channelPill,
                  selectedSalesChannel === 'B2B' && styles.channelPillActive,
                ]}
                onPress={() => setSelectedSalesChannel('B2B')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.channelPillText,
                    selectedSalesChannel === 'B2B' && styles.channelPillTextActive,
                  ]}
                >
                  B2B {channelCounts.b2b}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.channelPill,
                  selectedSalesChannel === 'HORECA' && styles.channelPillActive,
                ]}
                onPress={() => setSelectedSalesChannel('HORECA')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.channelPillText,
                    selectedSalesChannel === 'HORECA' && styles.channelPillTextActive,
                  ]}
                >
                  HORECA {channelCounts.horeca}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Sales Orders Cards List */}
            {filteredSalesOrders.map((so) => {
              const isFulfilment = so.status === 'In fulfilment';
              const isIssue = so.status === 'Issue';
              const isCompleted = so.status === 'Completed';

              return (
                <View key={so.id} style={styles.poCard}>
                  <View style={styles.poCardHeaderRow}>
                    <Text style={styles.poNumber}>
                      {so.soNumber} · {so.customerName}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isFulfilment
                          ? styles.badgeBlue
                          : isIssue
                          ? styles.badgeRed
                          : isCompleted
                          ? styles.badgeGreen
                          : styles.badgeGray,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isFulfilment
                            ? styles.badgeTextBlue
                            : isIssue
                            ? styles.badgeTextRed
                            : isCompleted
                            ? styles.badgeTextGreen
                            : styles.badgeTextGray,
                        ]}
                      >
                        {so.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.poDetailLine}>
                    {so.channel} · {so.itemCount} item{so.itemCount > 1 ? 's' : ''} · ₹
                    {so.totalPrice.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    · {so.paymentStatus}
                  </Text>
                  <Text style={styles.poDetailLine}>{so.subMeta}</Text>

                  <View style={styles.poActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleViewSalesOrder(so)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={styles.poActionText}>View Order</Text>
                    </TouchableOpacity>

                    {so.status !== 'Issue' && so.fulfilmentStatus !== 'Issue' && (
                      <TouchableOpacity
                        onPress={() => handleViewInvoice(so)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      >
                        <Text style={styles.poActionText}>Invoice</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ── 7. Filter Bottom Sheet Modal (Image 3) ── */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            if (activePicker) setActivePicker(null);
            else setIsFilterModalOpen(false);
          }}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Filters</Text>

            {/* Field 1: Farmer */}
            <View
              style={[
                styles.fieldBlock,
                { zIndex: activePicker === 'farmer' ? 60 : 6, elevation: activePicker === 'farmer' ? 20 : 0 },
              ]}
            >
              <Text style={styles.fieldLabel}>Farmer</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() => setActivePicker(activePicker === 'farmer' ? null : 'farmer')}
                activeOpacity={0.75}
              >
                <Text style={styles.dropdownValueText}>{selectedFarmer}</Text>
                <ChevronDownIcon size={18} />
              </TouchableOpacity>
              {activePicker === 'farmer' && (
                <View style={styles.dropdownFloatingMenu}>
                  {FARMER_OPTIONS.map((f) => {
                    const isSelected = selectedFarmer === f;
                    return (
                      <TouchableOpacity
                        key={f}
                        style={[
                          styles.dropdownMenuItem,
                          isSelected && styles.dropdownMenuItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedFarmer(f);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            isSelected && styles.dropdownMenuItemTextSelected,
                          ]}
                        >
                          {f}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Field 2: Product */}
            <View
              style={[
                styles.fieldBlock,
                { zIndex: activePicker === 'product' ? 50 : 5, elevation: activePicker === 'product' ? 20 : 0 },
              ]}
            >
              <Text style={styles.fieldLabel}>Product</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() => setActivePicker(activePicker === 'product' ? null : 'product')}
                activeOpacity={0.75}
              >
                <Text style={styles.dropdownValueText}>{selectedProduct}</Text>
                <ChevronDownIcon size={18} />
              </TouchableOpacity>
              {activePicker === 'product' && (
                <View style={styles.dropdownFloatingMenu}>
                  {PRODUCT_OPTIONS.map((p) => {
                    const isSelected = selectedProduct === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.dropdownMenuItem,
                          isSelected && styles.dropdownMenuItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedProduct(p);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            isSelected && styles.dropdownMenuItemTextSelected,
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Field 3: Warehouse */}
            <View
              style={[
                styles.fieldBlock,
                { zIndex: activePicker === 'warehouse' ? 40 : 4, elevation: activePicker === 'warehouse' ? 20 : 0 },
              ]}
            >
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() => setActivePicker(activePicker === 'warehouse' ? null : 'warehouse')}
                activeOpacity={0.75}
              >
                <Text style={styles.dropdownValueText}>{selectedWarehouse}</Text>
                <ChevronDownIcon size={18} />
              </TouchableOpacity>
              {activePicker === 'warehouse' && (
                <View style={styles.dropdownFloatingMenu}>
                  {WAREHOUSE_OPTIONS.map((w) => {
                    const isSelected = selectedWarehouse === w;
                    return (
                      <TouchableOpacity
                        key={w}
                        style={[
                          styles.dropdownMenuItem,
                          isSelected && styles.dropdownMenuItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedWarehouse(w);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            isSelected && styles.dropdownMenuItemTextSelected,
                          ]}
                        >
                          {w}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Field 4: PO date on or after */}
            <View style={[styles.fieldBlock, { zIndex: 3 }]}>
              <Text style={styles.fieldLabel}>PO date on or after</Text>
              <TouchableOpacity
                style={styles.dateInputBox}
                onPress={() => setShowCalendarModal(true)}
                activeOpacity={0.8}
              >
                <TextInput
                  style={styles.dateInput}
                  value={selectedDateAfter}
                  onChangeText={setSelectedDateAfter}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor="#786F68"
                />
                <TouchableOpacity
                  onPress={() => setShowCalendarModal(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Open calendar"
                >
                  <CalendarIcon size={18} color="#786F68" />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Field 5: Purchase status */}
            <View
              style={[
                styles.fieldBlock,
                {
                  zIndex: activePicker === 'purchaseStatus' ? 30 : 2,
                  elevation: activePicker === 'purchaseStatus' ? 20 : 0,
                },
              ]}
            >
              <Text style={styles.fieldLabel}>Purchase status</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() =>
                  setActivePicker(activePicker === 'purchaseStatus' ? null : 'purchaseStatus')
                }
                activeOpacity={0.75}
              >
                <Text style={styles.dropdownValueText}>{selectedPurchaseStatus}</Text>
                <ChevronDownIcon size={18} />
              </TouchableOpacity>
              {activePicker === 'purchaseStatus' && (
                <View style={styles.dropdownFloatingMenu}>
                  {PURCHASE_STATUS_OPTIONS.map((ps) => {
                    const isSelected = selectedPurchaseStatus === ps;
                    return (
                      <TouchableOpacity
                        key={ps}
                        style={[
                          styles.dropdownMenuItem,
                          isSelected && styles.dropdownMenuItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedPurchaseStatus(ps);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            isSelected && styles.dropdownMenuItemTextSelected,
                          ]}
                        >
                          {ps}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Field 6: Receipt status */}
            <View
              style={[
                styles.fieldBlock,
                {
                  zIndex: activePicker === 'receiptStatus' ? 20 : 1,
                  elevation: activePicker === 'receiptStatus' ? 20 : 0,
                },
              ]}
            >
              <Text style={styles.fieldLabel}>Receipt status</Text>
              <TouchableOpacity
                style={styles.dropdownSelectBox}
                onPress={() =>
                  setActivePicker(activePicker === 'receiptStatus' ? null : 'receiptStatus')
                }
                activeOpacity={0.75}
              >
                <Text style={styles.dropdownValueText}>{selectedReceiptStatus}</Text>
                <ChevronDownIcon size={18} />
              </TouchableOpacity>
              {activePicker === 'receiptStatus' && (
                <View style={styles.dropdownFloatingMenu}>
                  {RECEIPT_STATUS_OPTIONS.map((rs) => {
                    const isSelected = selectedReceiptStatus === rs;
                    return (
                      <TouchableOpacity
                        key={rs}
                        style={[
                          styles.dropdownMenuItem,
                          isSelected && styles.dropdownMenuItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedReceiptStatus(rs);
                          setActivePicker(null);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            isSelected && styles.dropdownMenuItemTextSelected,
                          ]}
                        >
                          {rs}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Buttons Row: Apply & Reset */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={handleApplyFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyButtonText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalResetButton}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ── Calendar Popup Overlay ── */}
        {showCalendarModal && (
          <TouchableOpacity
            style={styles.calendarModalOverlay}
            activeOpacity={1}
            onPress={() => setShowCalendarModal(false)}
          >
            <TouchableOpacity
              style={styles.calendarCard}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View style={styles.calHeaderRow}>
                <View>
                  <Text style={styles.calHeaderTitle}>Select PO Date</Text>
                  <Text style={styles.calHeaderSub}>
                    {tempSelectedDay} {MONTH_NAMES[calMonth]} {calYear}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.calCloseBtn}
                  onPress={() => setShowCalendarModal(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <CloseIcon size={18} color="#786F68" />
                </TouchableOpacity>
              </View>

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[
                    styles.presetPill,
                    tempSelectedDay === 24 && calMonth === 8 && calYear === 2026 && styles.presetPillActive,
                  ]}
                  onPress={() => {
                    setTempSelectedDay(24);
                    setCalMonth(8);
                    setCalYear(2026);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.presetPillText,
                      tempSelectedDay === 24 && calMonth === 8 && calYear === 2026 && styles.presetPillTextActive,
                    ]}
                  >
                    24 Sep 2026
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetPill,
                    tempSelectedDay === 30 && calMonth === 8 && calYear === 2026 && styles.presetPillActive,
                  ]}
                  onPress={() => {
                    setTempSelectedDay(30);
                    setCalMonth(8);
                    setCalYear(2026);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.presetPillText,
                      tempSelectedDay === 30 && calMonth === 8 && calYear === 2026 && styles.presetPillTextActive,
                    ]}
                  >
                    30 Sep 2026
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetPill}
                  onPress={() => {
                    setSelectedDateAfter('dd-mm-yyyy');
                    setShowCalendarModal(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.presetPillText}>Clear</Text>
                </TouchableOpacity>
              </View>

              {/* Month & Year Navigator */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={styles.navArrowBtn}
                  onPress={handlePrevMonth}
                  activeOpacity={0.7}
                >
                  <ChevronLeftIcon size={20} color="#1F1714" />
                </TouchableOpacity>

                <Text style={styles.monthNavTitle}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>

                <TouchableOpacity
                  style={styles.navArrowBtn}
                  onPress={handleNextMonth}
                  activeOpacity={0.7}
                >
                  <ChevronRightIcon size={20} color="#1F1714" />
                </TouchableOpacity>
              </View>

              {/* Weekday Headers */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((wd, i) => (
                  <View key={i} style={styles.weekdayCol}>
                    <Text style={styles.weekdayText}>{wd}</Text>
                  </View>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {Array.from({ length: getFirstDayOfWeek(calYear, calMonth) }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCellEmpty} />
                ))}
                {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = tempSelectedDay === dayNum;

                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => setTempSelectedDay(dayNum)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          isSelected && styles.dayCellTextSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Modal Bottom Actions */}
              <View style={styles.calActionRow}>
                <TouchableOpacity
                  style={styles.calCancelBtn}
                  onPress={() => setShowCalendarModal(false)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.calCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calApplyBtn}
                  onPress={handleApplyDate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calApplyText}>Apply Date</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 8,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    marginTop: 14,
    rowGap: 10,
  },
  kpiCard: {
    width: '48.5%',
    minHeight: 76,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  kpiValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.3,
  },
  kpiTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 4,
  },
  segmentedToggleContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: adminSpacing.md,
    marginTop: 14,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabActive: {
    backgroundColor: adminColors.brand,
  },
  segmentedTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  segmentedTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.md,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginTop: 12,
    marginBottom: 8,
  },
  poCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  poCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  poNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: '#D1F2DE',
  },
  badgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  badgeGray: {
    backgroundColor: '#F3F0EA',
  },
  badgeBlue: {
    backgroundColor: '#E0F2FE',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: '#15803D',
  },
  badgeTextAmber: {
    color: '#B45309',
  },
  badgeTextGray: {
    color: '#6D6761',
  },
  badgeTextBlue: {
    color: '#0284C7',
  },
  badgeTextRed: {
    color: '#DC2626',
  },
  channelPillsScroll: {
    paddingHorizontal: adminSpacing.md,
    gap: 8,
    paddingBottom: 10,
  },
  channelPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E0',
  },
  channelPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  channelPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5A524D',
  },
  channelPillTextActive: {
    color: '#FFFFFF',
  },
  poDetailLine: {
    fontSize: 13,
    color: '#5A524D',
    marginTop: 3,
    lineHeight: 18,
  },
  poActionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 6,
  },
  poActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 36,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.brand,
    marginBottom: 4,
  },
  fieldBlock: {
    position: 'relative',
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F1714',
    marginBottom: 5,
  },
  dropdownSelectBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F1714',
  },
  dropdownFloatingMenu: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: 2,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  dropdownMenuItemSelected: {
    backgroundColor: '#737373',
  },
  dropdownMenuItemText: {
    fontSize: 13.5,
    color: '#1F1714',
    fontWeight: '500',
  },
  dropdownMenuItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateInputBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F1714',
    paddingVertical: 0,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  modalApplyButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalApplyButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.brand,
  },
  modalResetButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalResetButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#3A3A3A',
  },
  modalSheetFooterCode: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#A0988E',
    marginTop: 18,
    marginBottom: 6,
  },
  calendarModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
    elevation: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5DFD7',
    ...adminShadow.lg,
  },
  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1714',
  },
  calHeaderSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.brand,
    marginTop: 2,
  },
  calCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    backgroundColor: '#FAF8F5',
  },
  presetPillActive: {
    borderColor: adminColors.brand,
    backgroundColor: '#FFF4EC',
  },
  presetPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#786F68',
  },
  presetPillTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F1714',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCol: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#9E948A',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellSelected: {
    backgroundColor: adminColors.brand,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F1714',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calActionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
    paddingTop: 12,
  },
  calCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  calCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#786F68',
  },
  calApplyBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
