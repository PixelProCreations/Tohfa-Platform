import React, { useState } from 'react';
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import type { ExpenseDraft, WarehouseScreenBaseProps } from './types';

/**
 * Add / edit expense form, shared by Main Warehouse and Sub Warehouse admins.
 * - Save Expense is enabled only when can('finance.expense.log'); otherwise it is
 *   rendered disabled and the handler no-ops.
 * - There is no approve control: rbac.json has no approve code for expenses.
 * - The form has no warehouse selector; the expense is logged against the viewer's scope.
 * The server re-checks every permission (CLAUDE.md 2.1); `can` only decides what to render.
 */

const EXPENSE_CATEGORIES = [
  'Transport',
  'Loading',
  'Unloading',
  'Maintenance',
  'Utilities',
  'Warehouse Operations',
  'Other',
];

export interface WarehouseAddExpenseScreenProps extends WarehouseScreenBaseProps {
  onSaveSuccess?: (() => void) | undefined;
  initialExpense?: ExpenseDraft | undefined;
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

function ChevronDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CameraIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function GalleryIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SaveFloppyIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuestionCircleIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleOutlineIcon({ size = 48, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" />
      <Path
        d="M16 9l-5.5 5.5L8 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function WarehouseAddExpenseScreen({
  can,
  onBack,
  onSaveSuccess,
  initialExpense,
}: WarehouseAddExpenseScreenProps) {
  const canLog = can('finance.expense.log');
  const [selectedCategory, setSelectedCategory] = useState(initialExpense?.category || 'Transport');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [expenseDate, setExpenseDate] = useState(initialExpense?.date || '25 Sep 2026');
  const [amount, setAmount] = useState(initialExpense?.amount || '2400');
  const [description, setDescription] = useState(initialExpense?.description || 'Transport · Collection point → Warehouse');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank'>(initialExpense?.paymentMethod || 'Cash');
  const [vendorPayee, setVendorPayee] = useState(initialExpense?.vendorPayee || '');
  const [, setAttachedDoc] = useState<string | null>(null);

  // Add Category State
  const [showAddCategoryScreen, setShowAddCategoryScreen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryStatus, setNewCategoryStatus] = useState('Active');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Confirmation state
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calendar State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(8); // September (0-indexed)
  const [tempSelectedDay, setTempSelectedDay] = useState(25);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setTempSelectedDay(day);
    const formatted = `${day} ${MONTH_SHORT[calMonth]} ${calYear}`;
    setExpenseDate(formatted);
  };

  const handleApplyDate = () => {
    const formatted = `${tempSelectedDay} ${MONTH_SHORT[calMonth]} ${calYear}`;
    setExpenseDate(formatted);
    setShowCalendarModal(false);
  };

  const handleQuickPreset = (day: number, month: number, year: number) => {
    setCalYear(year);
    setCalMonth(month);
    setTempSelectedDay(day);
    const formatted = `${day} ${MONTH_SHORT[month]} ${year}`;
    setExpenseDate(formatted);
  };

  const handleSaveExpense = () => {
    if (!canLog) return;
    if (!amount.trim() || isNaN(Number(amount.replace(/[^0-9.]/g, '')))) {
      Alert.alert('Validation Error', 'Please enter a valid expense amount.');
      return;
    }
    setIsConfirming(true);
  };

  const handleConfirmSave = () => {
    if (!canLog) return;
    setIsConfirming(false);
    setIsSuccess(true);
  };

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Validation Error', 'Please enter a category name.');
      return;
    }
    Alert.alert('Category Added', `Category "${newCategoryName}" has been successfully added.`);
    setShowAddCategoryScreen(false);
    setNewCategoryName('');
  };

  if (showAddCategoryScreen) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ─── Top Brand Header Banner ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowAddCategoryScreen(false)}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Category</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.confirmCard, { borderColor: adminColors.brand, paddingBottom: adminSpacing.input }]}>
            <View style={[styles.confirmHeaderRow, { marginBottom: adminSpacing.lg }]}>
              <Text style={{ ...adminType.sectionHead, color: adminColors.brandDeep }}>⊕ Add Category</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category Name</Text>
              <TextInput
                style={styles.textInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="e.g. Packaging"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Status</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowStatusPicker(!showStatusPicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownValueText}>{newCategoryStatus}</Text>
                <ChevronDownIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>

              {showStatusPicker && (
                <View style={styles.pickerDropdown}>
                  {['Active', 'Inactive'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.pickerOption,
                        newCategoryStatus === status && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setNewCategoryStatus(status);
                        setShowStatusPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          newCategoryStatus === status && styles.pickerOptionTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.confirmGreenBtn, { marginTop: adminSpacing.sm }]}
              onPress={handleSaveCategory}
              activeOpacity={0.8}
            >
              <CheckIcon size={18} color={adminColors.success.text} />
              <Text style={styles.confirmGreenBtnText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmCancelBtn, { marginTop: adminSpacing.md }]}
              onPress={() => setShowAddCategoryScreen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // If in Confirmation step, render confirmation view
  if (isConfirming) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ─── Top Brand Header Banner ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setIsConfirming(false)}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{initialExpense ? 'Edit Expense' : 'Add Expense'}</Text>
          </View>
        </View>

        {/* ─── Confirmation Content Area ─── */}
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmCard}>
            {/* Title with question icon */}
            <View style={styles.confirmHeaderRow}>
              <QuestionCircleIcon size={20} color={adminColors.brandDeep} />
              <Text style={styles.confirmHeaderTitle}>Save Expense?</Text>
            </View>

            {/* Inner Details Box */}
            <View style={styles.confirmDetailsBox}>
              <View style={styles.confirmDetailRow}>
                <View style={styles.confirmDetailCol}>
                  <Text style={styles.confirmDetailLabel}>Category</Text>
                  <Text style={styles.confirmDetailValue}>{selectedCategory}</Text>
                </View>

                <View style={styles.confirmDetailCol}>
                  <Text style={styles.confirmDetailLabel}>Amount</Text>
                  <Text style={styles.confirmDetailValue}>₹{amount}</Text>
                </View>
              </View>

              <View style={[styles.confirmDetailRow, { marginTop: adminSpacing.md }]}>
                <View style={styles.confirmDetailCol}>
                  <Text style={styles.confirmDetailLabel}>Date</Text>
                  <Text style={styles.confirmDetailValue}>{expenseDate}</Text>
                </View>
              </View>
            </View>

            {/* Confirm Outline Button (Green) */}
            <TouchableOpacity
              style={[styles.confirmGreenBtn, !canLog && styles.confirmBtnDisabled]}
              onPress={handleConfirmSave}
              disabled={!canLog}
              activeOpacity={0.8}
            >
              <CheckIcon size={18} color={adminColors.success.text} />
              <Text style={styles.confirmGreenBtnText}>Confirm</Text>
            </TouchableOpacity>

            {/* Cancel Outline Button (Warm Brown) */}
            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={() => setIsConfirming(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // If successfully recorded, show the Expense Recorded success screen
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        
        {/* Top Brand Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (onBack) onBack();
                else setIsSuccess(false);
              }}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Expense Recorded</Text>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircleOutlineIcon size={32} color={adminColors.success.text} />
          </View>
          <Text style={styles.successTitle}>Expense Recorded</Text>
          <Text style={styles.successSubtitle}>Expense ID EXP-001245</Text>

          <View style={styles.amountCard}>
            <Text style={styles.amountCardLabel}>Amount</Text>
            <Text style={styles.amountCardValue}>₹{amount}</Text>
          </View>
        </View>

        {/* Sticky Bottom Bar */}
        <View style={styles.successBottomBar}>
          <TouchableOpacity
            style={styles.viewExpenseBtn}
            onPress={() => {
              if (onSaveSuccess) onSaveSuccess();
              else if (onBack) onBack();
            }}
            activeOpacity={0.8}
          >
            <DocumentIcon size={18} color={adminColors.onBrand} />
            <Text style={styles.viewExpenseBtnText}>View Expense</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.headerTitle}>{initialExpense ? 'Edit Expense' : 'Add Expense'}</Text>
        </View>
      </View>

      {/* ─── Main Content Area with Overlay ─── */}
      <View style={{ flex: 1 }}>
        <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Heading: Expense Information */}
        <Text style={styles.sectionHeading}>Expense Information</Text>

        {/* Field 1: Expense Category */}
        <View style={styles.fieldGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.sm }}>
            <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>Expense Category</Text>
            <TouchableOpacity onPress={() => setShowAddCategoryScreen(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ ...adminType.sectionHead, color: adminColors.brand }}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownValueText}>{selectedCategory || 'Select Category'}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* Category Dropdown List */}
          {showCategoryPicker && (
            <View style={styles.pickerDropdown}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pickerOption,
                    selectedCategory === cat && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedCategory === cat && styles.pickerOptionTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Ported from the Main copy: the list is configuration, not a local list. */}
          <View style={styles.blueCallout}>
            <Text style={styles.blueCalloutText}>
              This list reflects Expense Categories (S06) configuration — never a separately maintained list.
            </Text>
          </View>
        </View>

        {/* Field 2: Expense Date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Expense Date</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowCalendarModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dateValueText}>{expenseDate}</Text>
            <CalendarIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Field 3: Amount */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <View style={styles.amountInputWrap}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        {/* Field 4: Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.textAreaInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter expense details..."
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Section Heading: Payment Information */}
        <View style={styles.fieldGroup}>
          <Text style={styles.sectionSubHeading}>Payment Information</Text>

          {/* Payment Method Segmented Buttons */}
          <View style={styles.paymentMethodRow}>
            {(['Cash', 'UPI', 'Bank'] as const).map((method) => {
              const isActive = paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodBtn,
                    isActive && styles.paymentMethodBtnActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      isActive && styles.paymentMethodTextActive,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Field 5: Vendor / Payee */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Vendor / Payee</Text>
          <TextInput
            style={styles.textInput}
            value={vendorPayee}
            onChangeText={setVendorPayee}
            placeholder="Optional — e.g. Local Transport Co."
            placeholderTextColor={adminColors.placeholder}
          />
        </View>

        {/* Field 6: Supporting Document */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Supporting Document</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => {
                setAttachedDoc('camera_receipt.jpg');
                Alert.alert('Camera', 'Photo captured and attached.');
              }}
              activeOpacity={0.75}
            >
              <CameraIcon size={22} color={adminColors.brandDeep} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => {
                setAttachedDoc('voucher_receipt.pdf');
                Alert.alert('Gallery', 'File attached from document gallery.');
              }}
              activeOpacity={0.75}
            >
              <GalleryIcon size={22} color={adminColors.brandDeep} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Callout 3: SWA Permissions Notice */}
        <View style={styles.amberCallout}>
          <Text style={styles.amberCalloutText}>
            {canLog
              ? 'Log Operational Expenses is granted — Save Expense is available. No approval control is added here; the matrix keeps logging expenses separate from approving expense claims.'
              : 'Log Operational Expenses is not granted for your role, so Save Expense is disabled.'}
          </Text>
        </View>

        {/* ─── Bottom Actions ─── */}
        <TouchableOpacity
          style={[styles.saveBtn, !canLog && styles.saveBtnDisabled]}
          onPress={handleSaveExpense}
          disabled={!canLog}
          accessibilityState={{ disabled: !canLog }}
          activeOpacity={0.8}
        >
          <SaveFloppyIcon size={18} color={canLog ? adminColors.onBrand : adminColors.muted} />
          <Text style={[styles.saveBtnText, !canLog && styles.saveBtnTextDisabled]}>Save Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>

      {/* ─── Interactive Calendar Picker Overlay ─── */}
      {showCalendarModal && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          <View style={styles.modalOverlay}>
            <View style={styles.calendarCard}>
            {/* Header: Title + Close Button */}
            <View style={styles.calHeaderRow}>
              <View>
                <Text style={styles.calHeaderTitle}>Select Expense Date</Text>
                <Text style={styles.calHeaderSub}>
                  {tempSelectedDay} {MONTH_NAMES[calMonth]} {calYear}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.calCloseBtn}
                onPress={() => setShowCalendarModal(false)}
                activeOpacity={0.7}
              >
                <CloseIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetPill,
                  tempSelectedDay === 25 && calMonth === 8 && calYear === 2026 && styles.presetPillActive,
                ]}
                onPress={() => handleQuickPreset(25, 8, 2026)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    tempSelectedDay === 25 && calMonth === 8 && calYear === 2026 && styles.presetPillTextActive,
                  ]}
                >
                  Today (25 Sep)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetPill,
                  tempSelectedDay === 24 && calMonth === 8 && calYear === 2026 && styles.presetPillActive,
                ]}
                onPress={() => handleQuickPreset(24, 8, 2026)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    tempSelectedDay === 24 && calMonth === 8 && calYear === 2026 && styles.presetPillTextActive,
                  ]}
                >
                  Yesterday (24 Sep)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetPill,
                  tempSelectedDay === 23 && calMonth === 8 && calYear === 2026 && styles.presetPillActive,
                ]}
                onPress={() => handleQuickPreset(23, 8, 2026)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    tempSelectedDay === 23 && calMonth === 8 && calYear === 2026 && styles.presetPillTextActive,
                  ]}
                >
                  23 Sep
                </Text>
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigator */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <ChevronLeftIcon size={20} color={adminColors.ink} />
              </TouchableOpacity>

              <Text style={styles.monthNavTitle}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>

              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handleNextMonth}
                activeOpacity={0.7}
              >
                <ChevronRightIcon size={20} color={adminColors.ink} />
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
                const isToday = dayNum === 25 && calMonth === 8 && calYear === 2026;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      isToday && !isSelected && styles.dayCellToday,
                    ]}
                    onPress={() => handleSelectDay(dayNum)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isSelected && styles.dayCellTextSelected,
                        isToday && !isSelected && styles.dayCellTextToday,
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
          </View>
        </View>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}

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
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  scroll: { flex: 1, backgroundColor: adminColors.canvas },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  sectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.md },
  sectionSubHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },

  fieldGroup: { marginBottom: adminSpacing.lg },
  fieldLabel: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.sm },

  // ─── Dropdown ───
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  dropdownValueText: { ...adminType.sectionHead, color: adminColors.ink },
  pickerDropdown: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: adminSpacing.sm,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  pickerOption: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerOptionActive: { backgroundColor: adminColors.brandTint },
  pickerOptionText: { ...adminType.body, color: adminColors.ink },
  pickerOptionTextActive: { ...adminType.sectionHead, color: adminColors.brandDeep },

  // ─── Date Picker ───
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  dateValueText: { ...adminType.body, color: adminColors.ink },

  // ─── Amount Input ───
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  currencySymbol: { ...adminType.title, color: adminColors.ink, marginRight: adminSpacing.sm },
  amountInput: { ...adminType.title, flex: 1, color: adminColors.ink, padding: 0, margin: 0 },

  // ─── Text Areas & Inputs ───
  textAreaInput: {
    ...adminType.body,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    color: adminColors.ink,
    minHeight: 70,
  },
  textInput: {
    ...adminType.body,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    color: adminColors.ink,
  },

  // ─── Payment Method Segmented ───
  paymentMethodRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.sm },
  paymentMethodBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodBtnActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  paymentMethodText: { ...adminType.rowTitle, color: adminColors.muted },
  paymentMethodTextActive: { ...adminType.rowTitle, color: adminColors.brandDeep },

  // ─── Upload Boxes ───
  uploadRow: { flexDirection: 'row', gap: adminSpacing.md },
  uploadBox: {
    width: 54,
    height: 54,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: adminColors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Callouts ───
  blueCallout: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  blueCalloutText: { ...adminType.rowMeta, color: adminColors.info.text },
  amberCallout: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  amberCalloutText: { ...adminType.rowMeta, color: adminColors.warning.text },

  // ─── Action Buttons ───
  saveBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  saveBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  // Visibly inert: flat, no shadow, muted label (viewer lacks finance.expense.log).
  saveBtnDisabled: {
    backgroundColor: adminColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnTextDisabled: { color: adminColors.muted },
  cancelBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  cancelBtnText: { ...adminType.sectionHead, color: adminColors.brand },

  // ─── Calendar Modal Styles ───
  // Was a translucent black scrim: no translucent token exists, so it is dropped
  // and the card's lg shadow separates it from the form.
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.input,
  },
  calendarCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    width: '100%',
    maxWidth: 360,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.lg,
  },
  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  calHeaderTitle: { ...adminType.sectionHead, color: adminColors.ink },
  calHeaderSub: { ...adminType.rowTitle, color: adminColors.brand, marginTop: 2 },
  calCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Presets Row
  presetRow: { flexDirection: 'row', gap: adminSpacing.sm, marginVertical: adminSpacing.md },
  presetPill: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: 6,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  presetPillText: { ...adminType.caption, color: adminColors.muted },
  presetPillTextActive: { ...adminType.caption, color: adminColors.brandDeep },

  // Month Navigation
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: adminSpacing.sm,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: { ...adminType.sectionHead, color: adminColors.ink },

  // Weekdays
  weekdaysRow: { flexDirection: 'row', paddingVertical: adminSpacing.xs, marginBottom: adminSpacing.xs },
  weekdayCol: { width: '14.28%', alignItems: 'center', justifyContent: 'center' },
  weekdayText: { ...adminType.caption, color: adminColors.muted },

  // Days Grid
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: adminSpacing.md },
  dayCellEmpty: { width: '14.28%', height: 38 },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  dayCellSelected: { backgroundColor: adminColors.brand },
  dayCellToday: { borderWidth: 1.5, borderColor: adminColors.brand },
  dayCellText: { ...adminType.body, color: adminColors.ink },
  dayCellTextSelected: { ...adminType.sectionHead, color: adminColors.onBrand },
  dayCellTextToday: { ...adminType.sectionHead, color: adminColors.brand },

  // Calendar Action Row
  calActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: adminSpacing.md,
  },
  calCancelBtn: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCancelText: { ...adminType.sectionHead, color: adminColors.muted },
  calApplyBtn: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyText: { ...adminType.sectionHead, color: adminColors.onBrand },

  // ─── Confirmation Screen Styles ───
  confirmationContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
  },
  confirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.brand,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  confirmHeaderTitle: { ...adminType.sectionHead, color: adminColors.ink },
  confirmDetailsBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  confirmDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmDetailCol: { flex: 1 },
  confirmDetailLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  confirmDetailValue: { ...adminType.sectionHead, color: adminColors.ink },
  confirmGreenBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.success.text,
    paddingVertical: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: adminSpacing.sm,
  },
  confirmBtnDisabled: { borderColor: adminColors.border, backgroundColor: adminColors.canvas },
  confirmGreenBtnText: { ...adminType.sectionHead, color: adminColors.success.text },
  confirmCancelBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtnText: { ...adminType.sectionHead, color: adminColors.brandDeep },

  // ─── Success Screen Styles ───
  successContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: adminSpacing.input,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xl,
  },
  successTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.sm },
  successSubtitle: { ...adminType.body, color: adminColors.muted, marginBottom: adminSpacing.xxl },
  amountCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.input,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  amountCardLabel: { ...adminType.body, color: adminColors.muted, marginBottom: adminSpacing.sm },
  amountCardValue: { ...adminType.kpiValue, color: adminColors.ink },
  successBottomBar: {
    backgroundColor: adminColors.card,
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  viewExpenseBtn: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.md,
    borderRadius: adminRadius.md,
    gap: adminSpacing.sm,
  },
  viewExpenseBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
});
