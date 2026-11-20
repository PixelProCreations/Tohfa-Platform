/**
 * Order Detail — everything about one customer order, with the next actions
 * (check stock, report an issue, cancel) and a menu for invoice and history.
 *
 * Gates (docs/rbac.json; the server re-checks every action, CLAUDE.md 2.1):
 *   - Cancel Order (bottom bar and menu): docs/rbac.json has NO order-cancel
 *     permission, so both entries stay ungated exactly as before. Spec gap,
 *     reported for SPEC_GAPS.md; do not invent a code here.
 *   - This screen has no warehouse assign / reassign control, so
 *     `order.warehouse.assign` is not consulted.
 */
// Design id: M5S04 (M5S04_OrderDetail)
import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal, StatusBar } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import type { OrderScreenBaseProps } from './types';

export interface OrderDetailScreenProps extends OrderScreenBaseProps {
  customerName?: string | undefined;
  role?: string | undefined;
  status?: string | undefined;
  routeParams?: Record<string, any> | undefined;
}

const SAMPLE_ORDER_ID = 'ORD-1024';
const SAMPLE_CUSTOMER = 'Arun Kumar';

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreDotsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="6" r="1.8" fill={adminColors.onBrand} />
      <Circle cx="12" cy="12" r="1.8" fill={adminColors.onBrand} />
      <Circle cx="12" cy="18" r="1.8" fill={adminColors.onBrand} />
    </Svg>
  );
}

function TimelineCheckDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={adminColors.success.text} />
      <Path d="M8 12l3 3 5-5" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TimelinePendingDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.muted} strokeWidth="2" fill={adminColors.canvas} />
    </Svg>
  );
}

function ChecklistIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path
        d="M7 8.5l1.8 1.8 3.5-3.5M14 9h3M7 14.5h10M7 17.5h6"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PackageBoxIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8H3V4h18v4zM21 8v12H3V8"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 12h4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PersonCheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="4" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 11l2 2 4-4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryTruckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={adminColors.onBrand} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={adminColors.onBrand} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={adminColors.onBrand} strokeWidth="2" />
    </Svg>
  );
}

function HistoryClockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function OrderDetailScreen({
  orderId = SAMPLE_ORDER_ID,
  customerName = SAMPLE_CUSTOMER,
  scope,
  can,
  role,
  status,
  routeParams,
  onBack,
  onNavigate,
}: OrderDetailScreenProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignedWarehouse, setAssignedWarehouse] = useState<string>(
    scope?.warehouseName && scope.warehouseName !== '—' ? scope.warehouseName : 'Coonoor'
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('Ooty');
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const canAssignWarehouse = can ? can('order.warehouse.assign') : true;
  const showAssignWarehouse = isSuperAdmin && canAssignWarehouse;

  // Mock data keyed off two demo invoice ids, as in the old M5S04, until orders are wired.
  const isInv251 = orderId === 'INV-00251' || orderId === 'ORD-00251';
  const isInv238 = orderId === 'INV-00238' || orderId === 'ORD-00238';

  const rawStatus = status || (routeParams as any)?.status;
  const displayStatus = rawStatus
    ? rawStatus
    : isInv251 || isInv238
      ? 'Paid · Completed'
      : orderId === 'ORD-1022'
        ? 'Packing'
        : orderId === 'ORD-1023'
          ? 'Ready for Pickup'
          : orderId === 'ORD-1021'
            ? 'Delivery'
            : 'Confirmed';

  const isPacking = displayStatus.toLowerCase().includes('packing');
  const isPickup = displayStatus.toLowerCase().includes('ready') || displayStatus.toLowerCase().includes('pickup');
  const isDelivery = displayStatus.toLowerCase().includes('delivery') || displayStatus.toLowerCase().includes('dispatch');
  const isCompleted = displayStatus.toLowerCase().includes('completed') || displayStatus.toLowerCase().includes('delivered');

  const primaryBtnConfig = isPacking
    ? {
        label: 'Pack Order',
        icon: <PackageBoxIcon />,
        onPress: () => onNavigate?.('M5S07', { orderId }),
      }
    : isPickup
      ? {
          label: 'Verify Pickup',
          icon: <PersonCheckIcon />,
          onPress: () => onNavigate?.('M5S10', { orderId, step: 'verify' }),
        }
      : isDelivery
        ? {
            label: 'Prepare Dispatch',
            icon: <DeliveryTruckIcon />,
            onPress: () => onNavigate?.('M5S13', { orderId }),
          }
        : isCompleted
          ? {
              label: 'View Timeline',
              icon: <HistoryClockIcon />,
              onPress: () => onNavigate?.('M5S15', { orderId }),
            }
          : {
              label: 'Check Stock',
              icon: <ChecklistIcon />,
              onPress: () => onNavigate?.('M5S05', { orderId }),
            };

  const displayDate = isInv251 ? '24 Sep, 10:42 AM' : isInv238 ? '20 Sep, 11:15 AM' : '24 Sep, 10:32 AM';
  const displayCustomer = customerName || (isInv251 || isInv238 ? 'Rajesh Kumar' : SAMPLE_CUSTOMER);
  // The order's warehouse comes from the viewer's scope; no warehouse name is hard-coded.
  const warehouseName = scope.warehouseName ?? '—';

  const orderItemsList = isInv251
    ? [{ name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' }]
    : isInv238
      ? [
          { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
          { name: 'Carrot', grade: 'Grade 1', qtyDetail: '1 KG × ₹150', price: '₹150' },
          { name: 'Beans', grade: 'Grade 1', qtyDetail: '2 KG × ₹150', price: '₹300' },
        ]
      : [
          { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
          { name: 'Carrot', grade: 'Grade 1', qtyDetail: '3 KG × ₹120', price: '₹360' },
        ];

  const subtotal = isInv251 ? '₹200' : isInv238 ? '₹650' : '₹560';
  const gst = isInv251 || isInv238 ? '₹0' : '₹28';
  const total = isInv251 ? '₹200' : isInv238 ? '₹650' : '₹588';

  const openFromMenu = (screen: string) => {
    setShowMenu(false);
    onNavigate?.(screen, { orderId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
              <BackArrowIcon />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{orderId}</Text>
              <View style={styles.headerStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerStatusText}>• {displayStatus}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.moreButton}
            activeOpacity={0.7}
            onPress={() => setShowMenu(true)}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="More order actions"
          >
            <MoreDotsIcon />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order ID</Text>
                <Text style={styles.colValue}>{orderId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Date</Text>
                <Text style={styles.colValue}>{displayDate}</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Status</Text>
                <Text style={styles.colValue}>{displayStatus}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Warehouse</Text>
                <Text style={styles.colValue}>{assignedWarehouse}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Customer</Text>
                <Text style={styles.colValue}>{displayCustomer}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Phone</Text>
                <Text style={styles.colValue}>+91 98765 43210</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Fulfillment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Fulfillment</Text>
                <Text style={styles.colValue}>Warehouse Pickup</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Warehouse</Text>
                <Text style={styles.colValue}>{assignedWarehouse} Warehouse</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Order Items ({orderItemsList.length})</Text>
          <View style={styles.card}>
            {orderItemsList.map((item, idx) => (
              <View key={item.name}>
                <View style={styles.orderItemHeaderRow}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemPrice}>{item.price}</Text>
                </View>
                <Text style={styles.orderItemSub}>{item.grade}</Text>
                <Text style={styles.orderItemSub}>{item.qtyDetail}</Text>
                {idx < orderItemsList.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <Text style={styles.sectionHeader}>Amount</Text>
          <View style={styles.card}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>{subtotal}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Discount</Text>
              <Text style={styles.amountValue}>₹0</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>GST</Text>
              <Text style={styles.amountValue}>{gst}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Delivery Fee</Text>
              <Text style={styles.amountValue}>₹0</Text>
            </View>

            <View style={styles.amountDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Payment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Status</Text>
                <Text style={styles.colValue}>Paid</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Method</Text>
                <Text style={styles.colValue}>Wallet</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Pickup Information</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Status</Text>
                <Text style={styles.colValue}>Pending</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup OTP</Text>
                <Text style={styles.colValue}>Verification required</Text>
              </View>
            </View>
            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Pickup Type</Text>
                <Text style={styles.colValue}>Direct Pickup</Text>
              </View>
            </View>
          </View>

          {/* ─── Assign to Warehouse Action (Only on Super Admin with order.warehouse.assign) ─── */}
          {showAssignWarehouse && (
            !isAssignOpen ? (
              <TouchableOpacity
                style={styles.assignToWarehouseBtn}
                onPress={() => setIsAssignOpen(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Assign to warehouse"
              >
                <Text style={styles.assignToWarehouseBtnText}>Assign to warehouse</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.assignSectionWrap}>
                <Text style={styles.sectionHeader}>Order assign</Text>
                <View style={styles.card}>
                  <Text style={styles.assignFieldLabel}>
                    Select Assign Warehouse <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>

                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setShowWarehousePicker(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Select Assign Warehouse"
                  >
                    <Text style={styles.dropdownText}>{selectedWarehouse}</Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M6 9l6 6 6-6"
                        stroke={adminColors.ink}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.assignOrderSubmitBtn}
                    onPress={() => {
                      setAssignedWarehouse(selectedWarehouse);
                      setIsAssignOpen(false);
                      Alert.alert(
                        'Order Assigned',
                        `Order ${orderId} has been successfully assigned to ${selectedWarehouse} Warehouse.`
                      );
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Assign order"
                  >
                    <Text style={styles.assignOrderSubmitBtnText}>Assign order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}

          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>Please pack tomatoes separately if possible.</Text>
          </View>

          {/* Workflow Stages Quick Access */}
          <Text style={styles.sectionHeader}>Workflow Stages</Text>
          <View style={styles.workflowStagesRow}>
            <TouchableOpacity
              style={[styles.stageChip, !isPacking && !isPickup && !isDelivery && !isCompleted && styles.stageChipActive]}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S05', { orderId })}
            >
              <Text style={[styles.stageChipText, !isPacking && !isPickup && !isDelivery && !isCompleted && styles.stageChipTextActive]}>
                Stock Check
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stageChip, isPacking && styles.stageChipActive]}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S07', { orderId })}
            >
              <Text style={[styles.stageChipText, isPacking && styles.stageChipTextActive]}>
                Packing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stageChip, isPickup && styles.stageChipActive]}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S10', { orderId, step: 'verify' })}
            >
              <Text style={[styles.stageChipText, isPickup && styles.stageChipTextActive]}>
                Pickup
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stageChip, isDelivery && styles.stageChipActive]}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S13', { orderId })}
            >
              <Text style={[styles.stageChipText, isDelivery && styles.stageChipTextActive]}>
                Delivery
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineHeaderRow}>
            <Text style={styles.sectionHeaderPlain}>Order Timeline</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('M5S15', { orderId })}>
              <Text style={styles.viewTimelineLink}>View full timeline</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelineDoneLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Order Placed</Text>
                <Text style={styles.timelineTime}>10:32 AM</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelinePendingLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Order Confirmed</Text>
                <Text style={styles.timelineTime}>10:34 AM</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelinePendingDot />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitlePending}>Stock Checked</Text>
                <Text style={styles.timelineTime}>—</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCheckBtn}
            activeOpacity={0.8}
            onPress={primaryBtnConfig.onPress}
          >
            {primaryBtnConfig.icon}
            <Text style={styles.primaryCheckBtnText}>{primaryBtnConfig.label}</Text>
          </TouchableOpacity>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.outlineHalfBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S16', { orderId })}
            >
              <Text style={styles.outlineHalfBtnText}>Report Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineHalfBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S17', { orderId })}
            >
              <Text style={styles.outlineHalfBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* More Actions Modal Menu */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Order Navigation & Actions</Text>
              {[
                { label: '1. Stock Check (M5S05)', screen: 'M5S05' },
                { label: '2. Packing Form (M5S07)', screen: 'M5S07' },
                { label: '3. Ready for Pickup List (M5S09)', screen: 'M5S09' },
                { label: '4. Pickup Verification & OTP (M5S10)', screen: 'M5S10', params: { step: 'verify' } },
                { label: '5. Delivery Preparation (M5S13)', screen: 'M5S13' },
                { label: '6. Dispatch Order (M5S14)', screen: 'M5S14' },
                { label: '7. Order Status History / Timeline (M5S15)', screen: 'M5S15' },
                { label: '8. Report Issue (M5S16)', screen: 'M5S16' },
                { label: '9. Cancel Order (M5S17)', screen: 'M5S17' },
                { label: '10. View Invoice (M5S18)', screen: 'M5S18' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.pickerOption}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowMenu(false);
                    onNavigate?.(item.screen, { orderId, ...(item.params ?? {}) });
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                  <Text style={{ color: adminColors.brandDeep, fontWeight: '700' }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Warehouse Selection Picker Modal */}
        <Modal
          visible={showWarehousePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWarehousePicker(false)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowWarehousePicker(false)}
          >
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Select Warehouse</Text>
              {['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'].map((wh) => (
                <TouchableOpacity
                  key={wh}
                  style={[
                    styles.pickerOption,
                    selectedWarehouse === wh && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedWarehouse(wh);
                    setShowWarehousePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedWarehouse === wh && styles.pickerOptionTextActive,
                    ]}
                  >
                    {wh}
                  </Text>
                  {selectedWarehouse === wh && (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 13l4 4L19 7"
                        stroke={adminColors.brand}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          {/* Was a translucent overlay; no translucent token, so the scrim is transparent and the sheet carries adminShadow.lg. */}
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={styles.menuSheet}>
              <Text style={styles.menuTitle}>Order Actions</Text>

              <TouchableOpacity style={styles.modalOption} onPress={() => openFromMenu('M5S18')}>
                <Text style={styles.modalOptionText}>View Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={() => openFromMenu('M5S15')}>
                <Text style={styles.modalOptionText}>Status History</Text>
              </TouchableOpacity>

              {/* Ungated: docs/rbac.json has no order-cancel permission (spec gap). */}
              <TouchableOpacity style={[styles.modalOption, styles.modalOptionLast]} onPress={() => openFromMenu('M5S17')}>
                <Text style={[styles.modalOptionText, styles.modalOptionDanger]}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Fixed component sizes (no size token exists for these).
const BACK_BUTTON = 32;
const MORE_BUTTON = 36;
const STATUS_DOT = 7;
const SECONDARY_BUTTON_HEIGHT = 48;

const styles = StyleSheet.create({
  // Assign to warehouse styles matching Image 2 and Image 4
  assignToWarehouseBtn: {
    height: 44,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  assignToWarehouseBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  assignSectionWrap: {
    marginBottom: 4,
  },
  assignFieldLabel: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    fontWeight: '600',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  dropdownSelector: {
    height: 44,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  dropdownText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  assignOrderSubmitBtn: {
    height: 42,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignOrderSubmitBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineHalfBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineHalfBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  pickerSheet: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: 20,
    ...adminShadow.lg,
  },
  pickerTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 14,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: adminRadius.sm,
    marginBottom: 4,
  },
  pickerOptionActive: {
    backgroundColor: adminColors.brandTint,
  },
  pickerOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerOptionTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: 14,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  backButton: { width: BACK_BUTTON, height: BACK_BUTTON, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  // Was a light mint dot on the orange header; mapped to the success tint.
  statusDot: {
    width: STATUS_DOT,
    height: STATUS_DOT,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
  },
  headerStatusText: { ...adminType.rowTitle, color: adminColors.onBrand },
  moreButton: {
    width: MORE_BUTTON,
    height: MORE_BUTTON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: adminSpacing.lg, paddingTop: 14 },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
    marginTop: 6,
  },
  sectionHeaderPlain: { ...adminType.sectionHead, color: adminColors.ink },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  rowGap: { marginTop: 14 },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  colLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 2 },
  colValue: { ...adminType.sectionHead, color: adminColors.ink },
  orderItemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItemName: { ...adminType.sectionHead, color: adminColors.ink },
  orderItemPrice: { ...adminType.sectionHead, color: adminColors.ink },
  orderItemSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  amountLabel: { ...adminType.body, color: adminColors.muted },
  amountValue: { ...adminType.sectionHead, color: adminColors.ink },
  amountDivider: { height: 1, backgroundColor: adminColors.border, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...adminType.sectionHead, color: adminColors.ink },
  totalValue: { ...adminType.title, color: adminColors.ink },
  notesText: { ...adminType.body, color: adminColors.ink },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
    marginTop: 6,
  },
  viewTimelineLink: { ...adminType.rowTitle, fontWeight: '700', color: adminColors.brand },
  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.xl,
    ...adminShadow.sm,
  },
  timelineRow: { flexDirection: 'row', minHeight: 46 },
  timelineIndicatorCol: { alignItems: 'center', width: 20, marginRight: 10 },
  timelineDoneLine: { width: 2, flex: 1, backgroundColor: adminColors.success.text, marginVertical: 3 },
  timelinePendingLine: { width: 2, flex: 1, backgroundColor: adminColors.border, marginVertical: 3 },
  timelineTextCol: { flex: 1, paddingBottom: 10 },
  timelineTitle: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  timelineTitlePending: { ...adminType.body, fontWeight: '700', color: adminColors.muted },
  timelineTime: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  bottomBar: {
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    paddingTop: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
    gap: adminSpacing.sm,
  },
  primaryCheckBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  primaryCheckBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  outlineActionBtn: {
    height: SECONDARY_BUTTON_HEIGHT,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  cancelOrderBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  cancelOrderBtnText: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  menuOverlay: { flex: 1, justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 20,
    paddingBottom: 36,
    ...adminShadow.lg,
  },
  menuTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.lg },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: adminColors.border },
  modalOptionLast: { borderBottomWidth: 0 },
  modalOptionText: { ...adminType.sectionHead, color: adminColors.ink },
  modalOptionDanger: { color: adminColors.danger.text },
  workflowStagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.md,
  },
  stageChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  stageChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  stageChipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
  stageChipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
});
