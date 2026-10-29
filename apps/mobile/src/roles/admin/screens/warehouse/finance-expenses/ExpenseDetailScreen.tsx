import React, { useState, useEffect } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import type { WarehouseScreenBaseProps } from './types';
import { useExpenseDetail } from './useFinanceData';
import { formatPaiseOrDash } from './mappers';

/**
 * Expense detail, shared by Main Warehouse and Sub Warehouse admins.
 * - Edit and Cancel are rendered only when can('finance.expense.log').
 * - No Approve/Reject control exists: rbac.json grants no approve code for expenses.
 * The server re-checks every permission (CLAUDE.md 2.1); `can` only decides what to render.
 */
export interface ExpenseDetailScreenProps extends WarehouseScreenBaseProps {
  expenseId?: string | undefined;
  amount?: number | string | undefined;
  category?: string | undefined;
  date?: string | undefined;
  description?: string | undefined;
  paymentMethod?: string | undefined;
  vendorPayee?: string | undefined;
  warehouse?: string | undefined;
  createdBy?: string | undefined;
  status?: string | undefined;
  isShortVersion?: boolean | undefined;
  isReceiptView?: boolean | undefined;
  onEdit?: (() => void) | undefined;
  onViewReceipt?: (() => void) | undefined;
  onViewVouchers?: (() => void) | undefined;
}

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

function DocumentIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TimelineCheckIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={adminColors.success.bg} />
      <Circle cx="12" cy="12" r="4" fill={color} />
    </Svg>
  );
}

function LockIcon({ size = 14, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PencilIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CancelCircleIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EyeIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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

function DownloadIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceiptCheckIcon({ size = 16, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={adminColors.success.bg} />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PrinterIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M6 14h12v8H6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ExpenseDetailScreen({
  expenseId = 'EXP-001245',
  amount = '2,400',
  category = 'Transport',
  date = '25 Sep 2026',
  description = 'Transport · Collection point → Warehouse',
  paymentMethod = 'Cash',
  vendorPayee = 'Local Transport Co.',
  warehouse,
  createdBy = 'SWA – Suresh',
  status = 'Recorded',
  isShortVersion = false,
  isReceiptView = false,
  scope,
  can,
  onBack,
  onEdit,
  onViewReceipt,
  onViewVouchers,
}: ExpenseDetailScreenProps) {
  const isMain = scope.warehouseId === undefined;
  const warehouseLabel = warehouse ?? scope.warehouseName ?? 'All Warehouses';
  const canLog = can('finance.expense.log');
  const [showReceiptScreen, setShowReceiptScreen] = useState(Boolean(isReceiptView));

  const { expense: liveExpense, rawDto } = useExpenseDetail(expenseId);
  const displayAmount = formatPaiseOrDash(liveExpense?.amountPaise);
  const displayCategory = liveExpense ? (liveExpense.categoryRef.split('·')[0]?.trim() || liveExpense.categoryRef) : category;
  const displayDate = liveExpense ? liveExpense.timestamp : date;
  const displayDescription = rawDto?.description || description;
  const displayPaymentMethod = rawDto?.paymentMethod || paymentMethod;
  const displayVendor = rawDto?.vendor || vendorPayee;
  const displayStatus = liveExpense ? liveExpense.status : status;
  const displayCreatedBy = rawDto?.recordedBy || createdBy;
  const displayWarehouse = liveExpense?.warehouseName || warehouseLabel;

  useEffect(() => {
    if (isReceiptView !== undefined) {
      setShowReceiptScreen(isReceiptView);
    }
  }, [isReceiptView]);

  const handleEditExpense = () => {
    if (!canLog) return;
    if (onEdit) {
      onEdit();
    } else {
      Alert.alert('Edit Expense', 'Expense editing is accessible for authorized supervisor roles.');
    }
  };

  const handleCancelExpense = () => {
    if (!canLog) return;
    Alert.alert(
      'Cancel Expense',
      `Are you sure you want to cancel expense ${expenseId}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Expense Cancelled', `${expenseId} has been marked as cancelled.`);
            onBack();
          },
        },
      ]
    );
  };

  const handleViewReceipt = () => {
    if (onViewReceipt) {
      onViewReceipt();
    } else {
      setShowReceiptScreen(true);
    }
  };

  const handleCloseReceipt = () => {
    if (isReceiptView) {
      onBack();
    } else {
      setShowReceiptScreen(false);
    }
  };

  const handleDownloadReceipt = () => {
    Alert.alert('Download Complete', `Receipt for ${expenseId} downloaded successfully.`);
  };

  // Ported from the Main copy: falls back to an alert when the host gives no voucher route.
  const handleViewVoucher = () => {
    if (onViewVouchers) {
      onViewVouchers();
    } else {
      Alert.alert('View Voucher', 'Opening voucher details...');
    }
  };

  const formattedAmount = displayAmount;

  // ─── Customized Receipt Screen (matches design colors) ───
  if (showReceiptScreen || isReceiptView) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ─── Top Brand Header Banner (transparent back arrow, no circle/box) ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCloseReceipt}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Expense Receipt</Text>
              <Text style={styles.headerSubtitle}>
                {expenseId} · ▫ {displayStatus}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.receiptHeaderBtn}
              onPress={handleDownloadReceipt}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Download receipt"
            >
              <DownloadIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Main Content Scroll ─── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Voucher Card */}
          <View style={styles.voucherCard}>
            {/* Top row with status badge */}
            <View style={styles.voucherStatusRow}>
              <View style={styles.statusPill}>
                <ReceiptCheckIcon size={14} color={adminColors.success.text} />
                <Text style={styles.statusPillText}>RECEIPT · RECORDED</Text>
              </View>
              <Text style={styles.voucherNoText}>RCT-{expenseId.replace('EXP-', '')}</Text>
            </View>

            {/* Title & Date */}
            <Text style={styles.voucherTitleText}>Official Expense Voucher</Text>
            <Text style={styles.voucherDateText}>{displayDate} · 10:30 AM IST</Text>

            {/* Dashed / Divider Line */}
            <View style={styles.voucherDividerLine} />

            {/* Highlighted Amount Box */}
            <View style={styles.voucherAmountBox}>
              <Text style={styles.voucherAmountLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.voucherAmountValue}>{formattedAmount}</Text>
              <Text style={styles.voucherAmountSub}>{displayCategory} · Paid via {displayPaymentMethod}</Text>
            </View>

            {/* Key Receipt Fields */}
            <View style={styles.voucherFieldGrid}>
              <View style={styles.voucherFieldCol}>
                <Text style={styles.voucherFieldLabel}>Expense ID</Text>
                <Text style={styles.voucherFieldValue}>{expenseId}</Text>
              </View>
              <View style={styles.voucherFieldCol}>
                <Text style={styles.voucherFieldLabel}>Category</Text>
                <Text style={styles.voucherFieldValue}>{displayCategory}</Text>
              </View>
            </View>

            <View style={[styles.voucherFieldGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.voucherFieldCol}>
                <Text style={styles.voucherFieldLabel}>Payee / Vendor</Text>
                <Text style={styles.voucherFieldValue}>{displayVendor}</Text>
              </View>
              <View style={styles.voucherFieldCol}>
                <Text style={styles.voucherFieldLabel}>Payment Method</Text>
                <Text style={styles.voucherFieldValue}>{displayPaymentMethod}</Text>
              </View>
            </View>

            <View style={[styles.voucherFieldGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.voucherFieldCol}>
                <Text style={styles.voucherFieldLabel}>Warehouse</Text>
                <Text style={styles.voucherFieldValue}>{displayWarehouse}</Text>
              </View>
              <View style={styles.voucherFieldCol}>
                <Text style={styles.voucherFieldLabel}>Logged By</Text>
                <Text style={styles.voucherFieldValue}>{displayCreatedBy}</Text>
              </View>
            </View>

            <View style={[styles.voucherFieldFull, { marginTop: adminSpacing.md }]}>
              <Text style={styles.voucherFieldLabel}>Description</Text>
              <Text style={styles.voucherFieldValue}>{displayDescription}</Text>
            </View>

            {/* Attached Supporting Document Card */}
            <View style={styles.attachedDocCard}>
              <View style={styles.receiptIconBox}>
                <DocumentIcon size={24} color={adminColors.brandDeep} />
              </View>
              <View style={styles.attachedDocInfo}>
                <Text style={styles.attachedDocTitle}>Attached Supporting Doc</Text>
                <Text style={styles.attachedDocSub}>{expenseId}_receipt.pdf · 142 KB</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.voucherActionsRow}>
            <TouchableOpacity
              style={styles.primaryDownloadBtn}
              onPress={handleDownloadReceipt}
              activeOpacity={0.8}
            >
              <DownloadIcon size={18} color={adminColors.onBrand} />
              <Text style={styles.primaryDownloadBtnText}>Download Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryPrintBtn}
              onPress={() => Alert.alert('Print / Share', `Sharing voucher for ${expenseId}...`)}
              activeOpacity={0.8}
            >
              <PrinterIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.secondaryPrintBtnText}>Print / Share</Text>
            </TouchableOpacity>
          </View>

          {/* Screen Footer Code */}
          <Text style={styles.screenFooterCode}>M11-S05-R · Expense Receipt</Text>
          <View style={{ height: adminSpacing.lg }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Expense Detail</Text>
            {!isShortVersion && (
              <Text style={styles.headerSubtitle}>
                {expenseId} · ▫ {displayStatus}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isShortVersion ? (
          // Ported from the Main copy: compact layout with only the headline facts.
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>Expense Detail</Text>
            <View style={styles.card}>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Expense ID</Text>
                  <Text style={styles.gridValue}>{expenseId}</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Category</Text>
                  <Text style={styles.gridValue}>{displayCategory}</Text>
                </View>
              </View>

              <View style={[styles.gridRow, { marginTop: adminSpacing.md }]}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Amount</Text>
                  <Text style={styles.gridValue}>{formattedAmount}</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Status</Text>
                  <Text style={styles.gridValue}>{displayStatus}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* ─── Section 1: Expense Summary ─── */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Expense Summary</Text>
              <View style={styles.card}>
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Expense ID</Text>
                    <Text style={styles.gridValue}>{expenseId}</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Amount</Text>
                    <Text style={styles.gridValue}>{formattedAmount}</Text>
                  </View>
                </View>

                <View style={[styles.gridRow, { marginTop: adminSpacing.md }]}>
                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Category</Text>
                    <Text style={styles.gridValue}>{displayCategory}</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Date</Text>
                    <Text style={styles.gridValue}>{displayDate}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ─── Section 2: Expense Details ─── */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Expense Details</Text>
              <View style={styles.card}>
                <Text style={styles.gridLabel}>Description</Text>
                <Text style={styles.descriptionValue}>{displayDescription}</Text>

                <View style={[styles.gridRow, { marginTop: adminSpacing.md }]}>
                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Payment Method</Text>
                    <Text style={styles.gridValue}>{displayPaymentMethod}</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Vendor / Payee</Text>
                    <Text style={styles.gridValue}>{displayVendor}</Text>
                  </View>
                </View>

                <View style={[styles.gridRow, { marginTop: adminSpacing.md }]}>
                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Warehouse</Text>
                    <Text style={styles.gridValue}>{displayWarehouse}</Text>
                  </View>

                  <View style={styles.gridCol}>
                    <Text style={styles.gridLabel}>Created By</Text>
                    <Text style={styles.gridValue}>{displayCreatedBy}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ─── Section 3: Receipt ─── */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Receipt</Text>
              <View style={styles.card}>
                <View style={styles.receiptRow}>
                  <View style={styles.receiptIconBox}>
                    <DocumentIcon size={22} color={adminColors.brandDeep} />
                  </View>

                  <View style={styles.receiptInfoCol}>
                    <Text style={styles.receiptTitle}>Supporting Document</Text>
                    <View style={styles.receiptActionsRow}>
                      <TouchableOpacity onPress={handleViewReceipt} activeOpacity={0.7}>
                        <Text style={styles.receiptActionText}>View</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleDownloadReceipt} activeOpacity={0.7}>
                        <Text style={[styles.receiptActionText, { marginLeft: adminSpacing.lg }]}>Download</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* ─── Section 4: Timeline ─── */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Timeline</Text>
              <View style={styles.card}>
                <View style={styles.timelineItemRow}>
                  <TimelineCheckIcon size={18} color={adminColors.success.text} />
                  <Text style={styles.timelineItemText}>Expense Created</Text>
                </View>

                <View style={styles.timelineConnector} />

                <View style={styles.timelineItemRow}>
                  <TimelineCheckIcon size={18} color={adminColors.success.text} />
                  <Text style={styles.timelineItemText}>Recorded</Text>
                </View>

                {/* Explanatory only: no approve code exists in rbac.json, so there is no control. */}
                {!isMain && (
                  <View style={styles.lockNoticeCard}>
                    <View style={styles.lockIconBox}>
                      <LockIcon size={14} color={adminColors.muted} />
                    </View>
                    <Text style={styles.lockNoticeText}>
                      Approve/Reject is not available on this screen — the role matrix marks "Approve expense claims" as not granted.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ─── Section 5: Actions ─── */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Actions</Text>
              <View style={styles.actionsRow}>
                {canLog && (
                  <TouchableOpacity
                    style={styles.actionBtnCard}
                    onPress={handleEditExpense}
                    activeOpacity={0.75}
                  >
                    <PencilIcon size={18} color={adminColors.brandDeep} />
                    <Text style={styles.actionBtnLabel}>Edit</Text>
                  </TouchableOpacity>
                )}

                {canLog && (
                  <TouchableOpacity
                    style={styles.actionBtnCard}
                    onPress={handleCancelExpense}
                    activeOpacity={0.75}
                  >
                    <CancelCircleIcon size={18} color={adminColors.brandDeep} />
                    <Text style={styles.actionBtnLabel}>Cancel</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionBtnCard}
                  onPress={handleViewReceipt}
                  activeOpacity={0.75}
                >
                  <EyeIcon size={18} color={adminColors.brandDeep} />
                  <Text style={styles.actionBtnLabel}>View Receipt</Text>
                </TouchableOpacity>
              </View>

              {isMain && onViewVouchers ? (
                <TouchableOpacity
                  style={styles.viewVoucherBtn}
                  onPress={handleViewVoucher}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewVoucherBtnText}>View Voucher</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}

        {/* Screen Footer Code */}
        <Text style={styles.screenFooterCode}>M11-S05 · Expense Detail</Text>

        <View style={{ height: adminSpacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.brand },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: adminSpacing.md, padding: 2 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  // Was a translucent white: no translucent token, so solid onBrand.
  headerSubtitle: { ...adminType.rowTitle, color: adminColors.onBrand, marginTop: 2 },
  scroll: { flex: 1, backgroundColor: adminColors.canvas },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  sectionWrap: { marginBottom: adminSpacing.lg },
  sectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },

  // Grid
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCol: { flex: 1 },
  gridLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  gridValue: { ...adminType.sectionHead, color: adminColors.ink },
  descriptionValue: { ...adminType.sectionHead, color: adminColors.ink },

  // Receipt Section
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  receiptIconBox: {
    width: 52,
    height: 52,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptInfoCol: { flex: 1 },
  receiptTitle: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.sm },
  receiptActionsRow: { flexDirection: 'row', alignItems: 'center' },
  receiptActionText: { ...adminType.sectionHead, color: adminColors.brandDeep },

  // Timeline
  timelineItemRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  timelineItemText: { ...adminType.sectionHead, color: adminColors.ink },
  timelineConnector: {
    width: 2,
    height: 18,
    backgroundColor: adminColors.border,
    marginLeft: adminSpacing.sm,
    marginVertical: 3,
  },
  lockNoticeCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
  },
  lockIconBox: { marginTop: 1 },
  lockNoticeText: { ...adminType.rowMeta, flex: 1, color: adminColors.muted },

  // Actions
  actionsRow: { flexDirection: 'row', gap: adminSpacing.sm },
  actionBtnCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  actionBtnLabel: { ...adminType.rowTitle, color: adminColors.ink },
  viewVoucherBtn: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  viewVoucherBtnText: { ...adminType.body, fontWeight: '700', color: adminColors.brandDeep },

  // Screen Footer
  screenFooterCode: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },

  // Customized Receipt Screen
  receiptHeaderBtn: {
    padding: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  voucherStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  statusPillText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  voucherNoText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  voucherTitleText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  voucherDateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
    marginBottom: adminSpacing.md,
  },
  voucherDividerLine: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  voucherAmountBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  voucherAmountLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  voucherAmountValue: {
    ...adminType.kpiValue,
    color: adminColors.brandDeep,
    marginTop: 2,
  },
  voucherAmountSub: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    marginTop: 2,
  },
  voucherFieldGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voucherFieldCol: {
    flex: 1,
  },
  voucherFieldFull: {
    width: '100%',
  },
  voucherFieldLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  voucherFieldValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  attachedDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.lg,
    gap: adminSpacing.md,
  },
  attachedDocInfo: {
    flex: 1,
  },
  attachedDocTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  attachedDocSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  voucherActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  primaryDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  primaryDownloadBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  secondaryPrintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  secondaryPrintBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
});
