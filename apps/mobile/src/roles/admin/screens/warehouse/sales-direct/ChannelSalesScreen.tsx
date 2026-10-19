import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import { ChannelOrderDetailScreen } from './ChannelOrderDetailScreen';
import { CHANNEL_COPY, CHANNEL_KPIS, CHANNEL_ORDERS } from './fixtures';
import { isAllWarehouses } from './SalesParts';
import type { ChannelOrderItem, SalesChannel } from './types';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function EyeMonitorIcon({ size = 18, color = adminColors.info.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BuildingIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 10h4a2 2 0 0 1 2 2v9M9 7h2M9 11h2M9 15h2M18 14h1M18 17h1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BanCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EditPencilIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CartOutlineIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="20" r="1.5" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="20" r="1.5" stroke={color} strokeWidth="2" />
      <Path d="M2 4h3l2.2 10.5a1.8 1.8 0 0 0 1.8 1.5h8.5a1.8 1.8 0 0 0 1.8-1.5L21 8H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardCheckIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6v4H9zM9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const WAREHOUSE_OPTIONS = [
  { id: undefined, name: 'All Warehouses' },
  { id: 'OOTY', name: 'Ooty' },
  { id: 'COONOOR', name: 'Coonoor' },
  { id: 'KOTAGIRI', name: 'Kotagiri' },
  { id: 'GUDALUR', name: 'Gudalur' },
] as const;

// ─── Component Props ─────────────────────────────────────────────────────────

export interface ChannelSalesScreenProps extends WarehouseScreenBaseProps {
  channel: SalesChannel;
  /** Host navigation to the order detail; renders inline when absent. */
  onSelectOrder?: ((order: ChannelOrderItem) => void) | undefined;
}

export function ChannelSalesScreen({
  scope,
  can,
  onBack,
  onNavigate,
  channel,
  onSelectOrder,
}: ChannelSalesScreenProps): React.JSX.Element {
  const isMain = isAllWarehouses(scope);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<ChannelOrderItem | null>(null);

  // Main Warehouse Filters & State
  const [pickedWarehouse, setPickedWarehouse] = useState<string | undefined>(undefined);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  // Create Order Flow State
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1); // 1 = Form, 2 = Review, 3 = Confirmation
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [serverOutcome, setServerOutcome] = useState<'Success' | 'Stock Shortage' | 'Permission Denied' | 'Network Error'>('Success');

  // Form Field State
  const [businessType, setBusinessType] = useState(channel === 'B2B' ? 'Retailer' : 'Hotel');
  const [businessName, setBusinessName] = useState(channel === 'B2B' ? 'Green Valley Retail Pvt Ltd' : 'Hilltop Resort & Restaurant');
  const [contactPerson, setContactPerson] = useState('Rajesh Sharma');
  const [phone, setPhone] = useState('9876543210');
  const [fulfillingWarehouse, setFulfillingWarehouse] = useState('Ooty');
  const [fulfilmentMode, setFulfilmentMode] = useState<'Delivery' | 'Pickup'>('Delivery');
  const [deliveryDate, setDeliveryDate] = useState('24/09/2026');
  const [deliveryAddress, setDeliveryAddress] = useState('12 Market Road, Ooty');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'UPI' | 'Cash'>('Bank Transfer');
  const [notes, setNotes] = useState('');

  // Order Items in Creation
  const [orderItems, setOrderItems] = useState<Array<{ name: string; grade: string; qty: number; unitPrice: number; lineTotal: number }>>([
    { name: 'Tomato', grade: 'Grade 1', qty: 10, unitPrice: 100, lineTotal: 1000 },
    { name: 'Tomato', grade: 'Grade 1', qty: 10, unitPrice: 100, lineTotal: 1000 },
    { name: 'Tomato', grade: 'Grade 1', qty: 10, unitPrice: 100, lineTotal: 1000 },
    { name: 'Tomato', grade: 'Grade 1', qty: 10, unitPrice: 100, lineTotal: 1000 },
  ]);

  // Add Item Modal Inputs
  const [modalProduct, setModalProduct] = useState('Tomato');
  const [modalGrade, setModalGrade] = useState('Grade 1');
  const [modalQty, setModalQty] = useState(10);
  const modalUnitPrice = modalProduct === 'Carrot' ? 120 : modalProduct === 'Beans' ? 90 : 100;
  const modalLineTotal = modalQty * modalUnitPrice;

  const orderTotalAmount = orderItems.reduce((acc, it) => acc + it.lineTotal, 0);

  const copy = CHANNEL_COPY[channel];
  const kpis = CHANNEL_KPIS[channel];

  const pickedWarehouseObj = WAREHOUSE_OPTIONS.find((w) => w.id === pickedWarehouse);
  const pickedWarehouseName = pickedWarehouseObj?.name ?? 'All Warehouses';

  // Main-specific sample orders matching M6-11 and M6-12 screenshots
  const mainOrders: ChannelOrderItem[] =
    channel === 'HORECA'
      ? [
          {
            id: 'HORECA-0021',
            channel: 'HORECA',
            businessName: 'Hilltop Resort & Restaurant',
            customerCode: 'CUS-H0021',
            status: 'Paid',
            itemCountText: '4 items · Coonoor',
            dateText: '24 Sep 2026',
            amount: 1250,
            warehouseName: 'Coonoor',
            items: [
              { name: 'Tomato Grade 1', grade: 'Grade 1', batch: 'BTH-00231', qtyText: '2 KG @ ₹100', pricePerUnit: 100, lineTotal: 200 },
              { name: 'Carrot Grade 1', grade: 'Grade 1', batch: 'BTH-00189', qtyText: '1 KG @ ₹120', pricePerUnit: 120, lineTotal: 120 },
              { name: 'Beans Grade 1', grade: 'Grade 1', batch: 'BTH-00155', qtyText: '5 KG @ ₹90', pricePerUnit: 90, lineTotal: 450 },
              { name: 'Potato Grade 1', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '10 KG @ ₹48', pricePerUnit: 48, lineTotal: 480 },
            ],
          },
          {
            id: 'HORECA-0020',
            channel: 'HORECA',
            businessName: 'Highland Residency Hotel',
            customerCode: 'CUS-H0020',
            status: 'Paid',
            itemCountText: '18 items · Ooty',
            dateText: '24 Sep 2026',
            amount: 2100,
            warehouseName: 'Ooty',
            items: [],
          },
          {
            id: 'HORECA-0019',
            channel: 'HORECA',
            businessName: 'Nilgiri Tea & Dine',
            customerCode: 'CUS-H0019',
            status: 'Paid',
            itemCountText: '8 items · Kotagiri',
            dateText: '23 Sep 2026',
            amount: 1450,
            warehouseName: 'Kotagiri',
            items: [],
          },
        ]
      : [
          {
            id: 'B2B-0041',
            channel: 'B2B',
            businessName: 'Green Valley Retail Pvt Ltd',
            customerCode: 'CUS-B0041',
            status: 'Paid',
            itemCountText: '12 items · Ooty',
            dateText: '22 Sep 2026',
            amount: 4400,
            warehouseName: 'Ooty',
            items: [
              { name: 'Tomato Grade 1', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '10 KG @ ₹100', pricePerUnit: 100, lineTotal: 1000 },
              { name: 'Tomato Grade 1', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '10 KG @ ₹100', pricePerUnit: 100, lineTotal: 1000 },
              { name: 'Tomato Grade 1', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '10 KG @ ₹100', pricePerUnit: 100, lineTotal: 1000 },
              { name: 'Tomato Grade 1', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '10 KG @ ₹100', pricePerUnit: 100, lineTotal: 1000 },
            ],
          },
          {
            id: 'B2B-0040',
            channel: 'B2B',
            businessName: 'Nilgiris Fresh Stores',
            customerCode: 'CUS-B0040',
            status: 'Paid',
            itemCountText: '8 items · Coonoor',
            dateText: '22 Sep 2026',
            amount: 2800,
            warehouseName: 'Coonoor',
            items: [],
          },
          {
            id: 'B2B-0039',
            channel: 'B2B',
            businessName: 'Apex Grocers Wholesalers',
            customerCode: 'CUS-B0039',
            status: 'Paid',
            itemCountText: '15 items · Kotagiri',
            dateText: '21 Sep 2026',
            amount: 3600,
            warehouseName: 'Kotagiri',
            items: [],
          },
        ];

  const rawList = isMain ? mainOrders : CHANNEL_ORDERS[channel];

  const filteredOrders = rawList.filter((order) => {
    if (isMain && pickedWarehouse) {
      const orderWh = order.warehouseName?.toUpperCase();
      if (orderWh && !orderWh.includes(pickedWarehouse)) return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      order.id.toLowerCase().includes(q) ||
      order.businessName.toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q)
    );
  });

  const handleOrderPress = (order: ChannelOrderItem) => {
    if (onSelectOrder) {
      onSelectOrder(order);
    } else {
      setSelectedOrderDetail(order);
    }
  };

  if (selectedOrderDetail) {
    return (
      <ChannelOrderDetailScreen
        scope={scope}
        can={can}
        onNavigate={onNavigate}
        channel={channel}
        order={selectedOrderDetail}
        onBack={() => setSelectedOrderDetail(null)}
      />
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ORDER CREATION FLOW (STEP 1, STEP 2, CONFIRMATION)
     ═══════════════════════════════════════════════════════════════════════════ */
  if (creatingOrder) {
    if (createStep === 3) {
      // Step 3: Order Created Confirmation
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  setCreatingOrder(false);
                  setCreateStep(1);
                }}
                activeOpacity={0.8}
              >
                <ArrowBackIcon size={24} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Order Created</Text>
            </View>
          </View>

          <ScrollView style={styles.mainContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.confirmationSuccessCircle}>
              <CheckmarkIcon size={32} color={adminColors.success.text} />
            </View>
            <Text style={styles.confirmationTitle}>Order Created</Text>
            <Text style={styles.confirmationSub}>- confirmed by the server</Text>

            <View style={styles.summaryCardBox}>
              <View style={styles.summaryGridRow}>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Order ID</Text>
                  <Text style={styles.summaryFieldValue}>{channel === 'B2B' ? 'B2B-0042' : 'HORECA-0022'}</Text>
                </View>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Status</Text>
                  <Text style={[styles.summaryFieldValue, { color: adminColors.warning.text }]}>Pending</Text>
                </View>
              </View>

              <View style={[styles.summaryGridRow, { marginTop: 12 }]}>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Business</Text>
                  <Text style={styles.summaryFieldValue}>{businessName}</Text>
                </View>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Mode</Text>
                  <Text style={styles.summaryFieldValue}>{fulfilmentMode}</Text>
                </View>
              </View>

              <View style={[styles.summaryGridRow, { marginTop: 12 }]}>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Warehouse</Text>
                  <Text style={styles.summaryFieldValue}>{fulfillingWarehouse}</Text>
                </View>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Items</Text>
                  <Text style={styles.summaryFieldValue}>{orderItems.length}</Text>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.summaryFieldLabel}>Total</Text>
                <Text style={styles.summaryFieldValueBold}>₹{orderTotalAmount}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => {
                setCreatingOrder(false);
                setCreateStep(1);
                handleOrderPress({
                  id: channel === 'B2B' ? 'B2B-0042' : 'HORECA-0022',
                  channel,
                  businessName,
                  customerCode: 'CUS-0099',
                  status: 'Pending',
                  itemCountText: `${orderItems.length} items · ${fulfillingWarehouse}`,
                  dateText: 'Today · Just now',
                  amount: orderTotalAmount,
                  warehouseName: fulfillingWarehouse,
                  items: orderItems.map((it) => ({
                    name: `${it.name} ${it.grade}`,
                    grade: it.grade,
                    batch: 'BTH-001',
                    qtyText: `${it.qty} KG @ ₹${it.unitPrice}`,
                    pricePerUnit: it.unitPrice,
                    lineTotal: it.lineTotal,
                  })),
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionBtnText}>View Order</Text>
            </TouchableOpacity>

            <View style={styles.confirmationBtnRow}>
              <TouchableOpacity
                style={styles.halfSecondaryBtn}
                onPress={() => {
                  setCreateStep(1);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.halfSecondaryBtnText}>Create Another</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.halfSecondaryBtn}
                onPress={() => {
                  setCreatingOrder(false);
                  setCreateStep(1);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.halfSecondaryBtnText}>Back to List</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    if (createStep === 2) {
      // Step 2: Review Order
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setCreateStep(1)} activeOpacity={0.8}>
                <ArrowBackIcon size={24} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Review Order</Text>
              <View style={styles.stepPillBadge}>
                <Text style={styles.stepPillText}>STEP 2 OF 2</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.mainContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Review Section 1: Business */}
            <Text style={styles.formSectionHeader}>Review Order</Text>
            <View style={styles.summaryCardBox}>
              <View style={styles.summaryGridRow}>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Business</Text>
                  <Text style={styles.summaryFieldValue}>{businessName}</Text>
                </View>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Type</Text>
                  <Text style={styles.summaryFieldValue}>{businessType}</Text>
                </View>
              </View>
              <View style={[styles.summaryGridRow, { marginTop: 12 }]}>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Contact</Text>
                  <Text style={styles.summaryFieldValue}>{contactPerson}</Text>
                </View>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Phone</Text>
                  <Text style={styles.summaryFieldValue}>{phone}</Text>
                </View>
              </View>
            </View>

            {/* Review Section 2: Fulfilment */}
            <Text style={styles.formSectionHeader}>Fulfilment</Text>
            <View style={styles.summaryCardBox}>
              <View style={styles.summaryGridRow}>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Warehouse</Text>
                  <Text style={styles.summaryFieldValue}>{fulfillingWarehouse}</Text>
                </View>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Mode</Text>
                  <Text style={styles.summaryFieldValue}>{fulfilmentMode}</Text>
                </View>
              </View>
              <View style={[styles.summaryGridRow, { marginTop: 12 }]}>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Delivery Date</Text>
                  <Text style={styles.summaryFieldValue}>{deliveryDate || '—'}</Text>
                </View>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Address</Text>
                  <Text style={styles.summaryFieldValue}>{deliveryAddress || '—'}</Text>
                </View>
              </View>
            </View>

            {/* Review Section 3: Items */}
            <Text style={styles.formSectionHeader}>Items</Text>
            <View style={styles.summaryCardBox}>
              {orderItems.map((item, idx) => (
                <View key={idx} style={[styles.reviewItemRow, idx > 0 && { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: adminColors.border }]}>
                  <Text style={styles.reviewItemLabel}>
                    {item.name} · {item.grade} · {item.qty} KG @ ₹{item.unitPrice}
                  </Text>
                  <Text style={styles.reviewItemPrice}>₹{item.lineTotal}</Text>
                </View>
              ))}
              <View style={[styles.reviewItemRow, { marginTop: 12, paddingTop: 10, borderTopWidth: 1.5, borderTopColor: adminColors.ink }]}>
                <Text style={styles.reviewTotalLabel}>Order Total</Text>
                <Text style={styles.reviewTotalPrice}>₹{orderTotalAmount}</Text>
              </View>
            </View>

            {/* Review Section 4: Payment & Notes */}
            <Text style={styles.formSectionHeader}>Payment & Notes</Text>
            <View style={styles.summaryCardBox}>
              <View style={styles.summaryGridRow}>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Payment Method</Text>
                  <Text style={styles.summaryFieldValue}>{paymentMethod}</Text>
                </View>
                <View style={styles.summaryGridCol}>
                  <Text style={styles.summaryFieldLabel}>Initial Status</Text>
                  <Text style={[styles.summaryFieldValue, { color: adminColors.warning.text }]}>Pending</Text>
                </View>
              </View>
            </View>

            {/* Note Box matching design */}
            <View style={[styles.formInfoBox, { marginBottom: 16 }]}>
              <BanCircleIcon size={16} color={adminColors.brandDeep} />
              <Text style={styles.formInfoText}>
                Total is the items subtotal. Any applicable discount or GST is applied by the system when the invoice is generated.
              </Text>
            </View>

            {/* Server Outcome (Demo) */}
            <Text style={styles.formSectionHeader}>Server Outcome (Demo)</Text>
            <View style={styles.demoOutcomesWrap}>
              {(['Success', 'Stock Shortage', 'Permission Denied', 'Network Error'] as const).map((outcome) => {
                const isActive = serverOutcome === outcome;
                return (
                  <TouchableOpacity
                    key={outcome}
                    style={[
                      styles.demoOutcomeChip,
                      isActive && styles.demoOutcomeChipActive,
                    ]}
                    onPress={() => setServerOutcome(outcome)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.demoOutcomeChipText,
                        isActive && styles.demoOutcomeChipTextActive,
                      ]}
                    >
                      {outcome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => {
                if (serverOutcome === 'Success') {
                  setCreateStep(3);
                } else if (serverOutcome === 'Stock Shortage') {
                  Alert.alert('Stock Shortage', 'Insufficient stock in fulfilling warehouse for the requested items.');
                } else if (serverOutcome === 'Permission Denied') {
                  Alert.alert('Permission Denied', 'User role does not have permission to place channel orders.');
                } else if (serverOutcome === 'Network Error') {
                  Alert.alert('Network Error', 'Failed to connect to server. Please try again.');
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionBtnText}>Place Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToEditBtn}
              onPress={() => setCreateStep(1)}
              activeOpacity={0.7}
            >
              <Text style={styles.backToEditBtnText}>Back to Edit</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // Step 1: New Order Form
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setCreatingOrder(false)} activeOpacity={0.8}>
              <ArrowBackIcon size={24} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{channel === 'B2B' ? 'New B2B Order' : 'New HORECA Order'}</Text>
            <View style={styles.stepPillBadge}>
              <Text style={styles.stepPillText}>STEP 1 OF 2</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.mainContainer} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {/* Section 1: Business Details */}
          <Text style={styles.formSectionHeader}>Business Details</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputFieldLabel}>Existing business (tap to prefill)</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.inputTextInput}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Business Name"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Business Type</Text>
            <View style={styles.chipRowWrap}>
              {(channel === 'B2B' ? ['Retailer', 'Distributor', 'Wholesaler', 'Other'] : ['Hotel', 'Restaurant', 'Resort', 'Other']).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, businessType === t && styles.typeChipActive]}
                  onPress={() => setBusinessType(t)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.typeChipText, businessType === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Business Name *</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.inputTextInput}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Hilltop Resort & Restaurant"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Contact Person *</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.inputTextInput}
                value={contactPerson}
                onChangeText={setContactPerson}
                placeholder="Name"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Phone *</Text>
            <View style={styles.textInputBox}>
              <TextInput
                style={styles.inputTextInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          </View>

          {/* Section 2: Fulfilment */}
          <Text style={styles.formSectionHeader}>Fulfilment</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputFieldLabel}>Fulfilling Warehouse *</Text>
            <View style={styles.chipRowWrap}>
              {['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur Market'].map((wh) => (
                <TouchableOpacity
                  key={wh}
                  style={[styles.typeChip, fulfillingWarehouse === wh && styles.typeChipActive]}
                  onPress={() => setFulfillingWarehouse(wh)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.typeChipText, fulfillingWarehouse === wh && styles.typeChipTextActive]}>{wh}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Fulfilment Mode *</Text>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[styles.modeToggleBtn, fulfilmentMode === 'Delivery' && styles.modeToggleBtnActive]}
                onPress={() => setFulfilmentMode('Delivery')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeToggleText, fulfilmentMode === 'Delivery' && styles.modeToggleTextActive]}>Delivery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeToggleBtn, fulfilmentMode === 'Pickup' && styles.modeToggleBtnActive]}
                onPress={() => setFulfilmentMode('Pickup')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeToggleText, fulfilmentMode === 'Pickup' && styles.modeToggleTextActive]}>Pickup</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Required Delivery Date *</Text>
            <View style={styles.textInputBoxWithIcon}>
              <TextInput
                style={styles.inputTextInput}
                value={deliveryDate}
                onChangeText={setDeliveryDate}
                placeholder="mm/dd/yyyy"
                placeholderTextColor={adminColors.placeholder}
              />
              <CalendarIcon size={18} color={adminColors.muted} />
            </View>

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Delivery Address *</Text>
            <View style={styles.textInputBoxWithIcon}>
              <TextInput
                style={styles.inputTextInput}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Street, area, landmark"
                placeholderTextColor={adminColors.placeholder}
              />
              <EditPencilIcon size={16} color={adminColors.muted} />
            </View>
          </View>

          {/* Section 3: Order Items */}
          <Text style={styles.formSectionHeader}>Order Items *</Text>
          <View style={styles.formCard}>
            {orderItems.length === 0 ? (
              <Text style={styles.noItemsText}>No items added yet</Text>
            ) : (
              orderItems.map((item, idx) => (
                <View key={idx} style={[styles.reviewItemRow, idx > 0 && { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: adminColors.border }]}>
                  <Text style={styles.reviewItemLabel}>
                    {item.name} · {item.grade} · {item.qty} KG @ ₹{item.unitPrice}
                  </Text>
                  <Text style={styles.reviewItemPrice}>₹{item.lineTotal}</Text>
                </View>
              ))
            )}

            <TouchableOpacity
              style={styles.addItemOutlineBtn}
              onPress={() => setShowAddItemModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addItemOutlineBtnText}>+ Add Item</Text>
            </TouchableOpacity>

            <View style={styles.formInfoBox}>
              <BanCircleIcon size={16} color={adminColors.muted} />
              <Text style={styles.formInfoText}>
                Unit prices come from the configured retail price and cannot be edited here. Stock is validated by the server when the order is placed.
              </Text>
            </View>
          </View>

          {/* Section 4: Payment */}
          <Text style={styles.formSectionHeader}>Payment</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputFieldLabel}>Expected Payment Method</Text>
            <View style={styles.chipRowWrap}>
              {(['Bank Transfer', 'UPI', 'Cash'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.typeChip, paymentMethod === m && styles.typeChipActive]}
                  onPress={() => setPaymentMethod(m)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.typeChipText, paymentMethod === m && styles.typeChipTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.formInfoBox, { marginTop: 12 }]}>
              <Text style={styles.formInfoText}>
                The order is created with status Pending. Payment is recorded against the order separately.
              </Text>
            </View>
          </View>

          {/* Section 5: Notes */}
          <Text style={styles.formSectionHeader}>Notes</Text>
          <View style={styles.formCard}>
            <View style={[styles.textInputBox, { minHeight: 70 }]}>
              <TextInput
                style={[styles.inputTextInput, { height: 60 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional — special instructions"
                placeholderTextColor={adminColors.placeholder}
                multiline
              />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View style={styles.stickyOrderBar}>
          <View style={styles.stickyOrderMetaRow}>
            <Text style={styles.stickyItemsCount}>{orderItems.length} items</Text>
            <Text style={styles.stickyItemsAmount}>₹{orderTotalAmount}</Text>
          </View>
          <TouchableOpacity
            style={styles.reviewOrderButton}
            onPress={() => setCreateStep(2)}
            activeOpacity={0.85}
          >
            <ClipboardCheckIcon size={20} color={adminColors.onBrand} />
            <Text style={styles.reviewOrderButtonText}>Review Order</Text>
          </TouchableOpacity>
        </View>

        {/* Add Item Modal */}
        <Modal
          visible={showAddItemModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddItemModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowAddItemModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeaderRow}>
                    <CartOutlineIcon size={22} color={adminColors.brand} />
                    <Text style={styles.modalTitle}>Add Item</Text>
                  </View>

                  <Text style={styles.modalSubLabel}>Product</Text>
                  <View style={styles.chipRowWrap}>
                    {['Tomato', 'Carrot', 'Cabbage', 'Beans', 'Radish'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.modalChip, modalProduct === p && styles.modalChipActive]}
                        onPress={() => setModalProduct(p)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalChipText, modalProduct === p && styles.modalChipTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.modalSubLabel, { marginTop: 12 }]}>Grade</Text>
                  <View style={styles.chipRowWrap}>
                    {['Grade 1', 'Grade 2'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.modalChip, modalGrade === g && styles.modalChipActive]}
                        onPress={() => setModalGrade(g)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalChipText, modalGrade === g && styles.modalChipTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.modalSubLabel, { marginTop: 12 }]}>Quantity (KG)</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setModalQty(Math.max(1, modalQty - 5))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValueText}>{modalQty} KG</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setModalQty(modalQty + 5)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalPriceRow}>
                    <Text style={styles.modalPriceLabel}>Unit price (configured)</Text>
                    <Text style={styles.modalPriceValue}>₹{modalUnitPrice}/KG</Text>
                  </View>
                  <View style={styles.modalPriceRow}>
                    <Text style={styles.modalPriceLabel}>Line total</Text>
                    <Text style={styles.modalPriceValueBold}>₹{modalLineTotal}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.modalAddBtn}
                    onPress={() => {
                      setOrderItems([
                        ...orderItems,
                        { name: modalProduct, grade: modalGrade, qty: modalQty, unitPrice: modalUnitPrice, lineTotal: modalLineTotal },
                      ]);
                      setShowAddItemModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalAddBtnText}>Add to Order</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowAddItemModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DEFAULT SALES LIST VIEW
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{copy.salesTitle}</Text>
        </View>

        {isMain ? (
          <View style={styles.warehouseDropdownRow}>
            <TouchableOpacity
              style={styles.warehouseDropdownPill}
              onPress={() => setShowWarehouseModal(true)}
              activeOpacity={0.85}
            >
              <BuildingIcon size={16} color={adminColors.brand} />
              <Text style={styles.warehouseDropdownText}>{pickedWarehouseName}</Text>
              <ChevronDownIcon size={16} color={adminColors.brand} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* ─── Warehouse Selection Modal (Main Warehouse) ─── */}
      {isMain ? (
        <Modal
          visible={showWarehouseModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWarehouseModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowWarehouseModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Warehouse</Text>
                  {WAREHOUSE_OPTIONS.map((item) => {
                    const isSelected = pickedWarehouse === item.id;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                        onPress={() => {
                          setPickedWarehouse(item.id);
                          setShowWarehouseModal(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                          {item.name}
                        </Text>
                        {isSelected ? <CheckmarkIcon size={18} color={adminColors.brand} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowWarehouseModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}

      {/* ─── Main Content ─── */}
      <View style={styles.mainContainer}>
        {isMain ? (
          /* ─── Main Warehouse Top 2 KPI Cards ─── */
          <View style={styles.mainKpiRow}>
            <View style={styles.mainKpiCardHalf}>
              <Text style={styles.mainKpiLabel}>{channel === 'HORECA' ? 'HORECA SALES' : 'B2B SALES'}</Text>
              <Text style={styles.mainKpiValue}>{channel === 'HORECA' ? '₹4,800' : '₹4,400'}</Text>
            </View>
            <View style={styles.mainKpiCardHalf}>
              <Text style={styles.mainKpiLabel}>ORDERS</Text>
              <Text style={styles.mainKpiValue}>{channel === 'HORECA' ? '5' : '4'}</Text>
            </View>
          </View>
        ) : (
          /* ─── Subwarehouse 4-Box Row & Policy ─── */
          <>
            <View style={styles.policyBanner}>
              <EyeMonitorIcon size={18} color={adminColors.info.text} />
              <Text style={styles.policyBannerText}>{copy.monitoringNotice}</Text>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNumber}>{kpis.orders}</Text>
                <Text style={styles.kpiLabel}>ORDERS</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNumber}>{kpis.pending}</Text>
                <Text style={styles.kpiLabel}>PENDING</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNumber}>{kpis.processing}</Text>
                <Text style={styles.kpiLabel}>PROCESSING</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNumber}>{kpis.completed}</Text>
                <Text style={styles.kpiLabel}>COMPLETED</Text>
              </View>
            </View>
          </>
        )}

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBarWrap}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isMain
                ? channel === 'HORECA'
                  ? 'Order / hotel / restaurant / customer'
                  : 'Order / business / customer'
                : copy.searchPlaceholder
            }
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Orders List ─── */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => handleOrderPress(item)}
                activeOpacity={0.82}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.orderIdText}>{item.id}</Text>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>Paid</Text>
                  </View>
                </View>

                <Text style={styles.businessNameText}>{item.businessName}</Text>
                <View style={styles.cardDivider} />

                <View style={styles.cardBottomRow}>
                  <Text style={styles.itemCountText}>{item.itemCountText}</Text>
                  <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.dateText}>{item.dateText}</Text>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            isMain ? (
              <View style={styles.disclaimerNoticeCard}>
                <BanCircleIcon size={18} color={adminColors.muted} />
                <Text style={styles.disclaimerNoticeText}>
                  {channel === 'HORECA'
                    ? 'MWA can view and create HORECA orders here. No Edit, Delete, payment/quantity modification, or order approval.'
                    : 'MWA can view and create B2B orders here. No Edit, Delete, payment/quantity modification, or order approval.'}
                </Text>
              </View>
            ) : null
          }
        />

        {/*
          BR-13 / Spec gap: Creating a HORECA / B2B order has no backend permission
          or endpoint (BR-13: 501). Read-only list per plan Phase 12.
        */}
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: adminSpacing.sm,
  },
  stepPillBadge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  warehouseDropdownRow: {
    marginTop: 8,
  },
  warehouseDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
    ...adminShadow.sm,
  },
  warehouseDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },

  /* Main Warehouse 2-Card KPI Row */
  mainKpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: adminSpacing.md,
  },
  mainKpiCardHalf: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...adminShadow.sm,
  },
  mainKpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mainKpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.ink,
  },

  /* Subwarehouse styles */
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  policyBannerText: {
    ...adminType.rowMeta,
    flex: 1,
    color: adminColors.info.text,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiNumber: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginBottom: 2,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.3,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    marginBottom: adminSpacing.md,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    marginLeft: adminSpacing.sm,
    color: adminColors.ink,
    padding: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  paidBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  paidBadgeText: {
    color: adminColors.success.text,
    fontSize: 12,
    fontWeight: '700',
  },
  businessNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '400',
    color: adminColors.muted,
    marginTop: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },

  disclaimerNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  disclaimerNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
    lineHeight: 18,
  },

  createOrderBottomBtn: {
    backgroundColor: adminColors.brand,
    paddingVertical: 14,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  createOrderBottomBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  /* Form & Create Order Styles */
  formSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 14,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 6,
  },
  textInputBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInputBoxWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputTextInput: {
    flex: 1,
    fontSize: 14,
    color: adminColors.ink,
    padding: 0,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  typeChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.muted,
  },
  typeChipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  modeToggleBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  modeToggleTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  noItemsText: {
    fontSize: 13,
    color: adminColors.muted,
    textAlign: 'center',
    marginVertical: 12,
  },
  addItemOutlineBtn: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addItemOutlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brand,
  },
  formInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  formInfoText: {
    flex: 1,
    fontSize: 12,
    color: adminColors.brandDeep,
    lineHeight: 16,
  },

  stickyOrderBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    ...adminShadow.md,
  },
  stickyOrderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stickyItemsCount: {
    fontSize: 13,
    color: adminColors.muted,
    fontWeight: '600',
  },
  stickyItemsAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  reviewOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    paddingVertical: 14,
    borderRadius: adminRadius.lg,
    gap: 8,
  },
  reviewOrderButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  /* Review Order & Summary Card Styles */
  summaryCardBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  summaryGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryGridCol: {
    flex: 1,
  },
  summaryFieldLabel: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 2,
  },
  summaryFieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  summaryFieldValueBold: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  reviewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
    flex: 1,
  },
  reviewItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  reviewTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  reviewTotalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  primaryActionButton: {
    backgroundColor: adminColors.brand,
    paddingVertical: 14,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  backToEditBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToEditBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  demoOutcomesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  demoOutcomeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  demoOutcomeChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  demoOutcomeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  demoOutcomeChipTextActive: {
    color: adminColors.onBrand,
  },

  /* Confirmation Styles */
  confirmationSuccessCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
  },
  confirmationSub: {
    fontSize: 13,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  confirmationBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfSecondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  halfSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },

  /* Modal Backdrop & Content */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  modalSubLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 8,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  modalChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  modalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
  },
  modalChipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalPriceLabel: {
    fontSize: 13,
    color: adminColors.muted,
  },
  modalPriceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalPriceValueBold: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalAddBtn: {
    backgroundColor: adminColors.brand,
    paddingVertical: 12,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  modalAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.muted,
  },

  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalItemSelected: {
    backgroundColor: adminColors.brandTint,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: adminColors.ink,
  },
  modalItemTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
});

