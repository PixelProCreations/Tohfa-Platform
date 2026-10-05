import React, { useState } from 'react';
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  peachBg:       '#FDF0EB',
  iconColor:     '#8B5E3C',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textDark:      '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',
  amberBg:       '#FEF3C7',
  amberBorder:   '#FDE68A',
  amberText:     '#92400E',
};

const EXPENSE_CATEGORIES = [
  'Transport',
  'Loading',
  'Unloading',
  'Maintenance',
  'Utilities',
  'Warehouse Operations',
  'Other',
];

export interface MainWarehouseAddExpenseScreenProps {
  onBack?: (() => void) | undefined;
  onSaveSuccess?: (() => void) | undefined;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 16, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CameraIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
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

function GalleryIcon({ size = 22, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SaveFloppyIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function QuestionCircleIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
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

function CheckIcon({ size = 18, color = '#059669' }: { size?: number; color?: string }) {
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

export function MainWarehouseAddExpenseScreen({
  onBack,
  onSaveSuccess,
}: MainWarehouseAddExpenseScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('Transport');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [expenseDate, setExpenseDate] = useState('25 Sep 2026');
  const [amount, setAmount] = useState('2400');
  const [description, setDescription] = useState('Transport from Coonoor collection point to warehouse');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [vendorPayee, setVendorPayee] = useState('');
  const [attachedDoc, setAttachedDoc] = useState<string | null>(null);

  // Confirmation & Success state
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
    if (!amount.trim() || isNaN(Number(amount.replace(/[^0-9.]/g, '')))) {
      Alert.alert('Validation Error', 'Please enter a valid expense amount.');
      return;
    }
    setIsConfirming(true);
  };

  const handleConfirmSave = () => {
    setIsConfirming(false);
    setIsSuccess(true);
  };
  // If in Success step, render success view
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
        
        {/* ─── Top Brand Header Banner ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (onBack) onBack();
              }}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Expense Recorded</Text>
          </View>
        </View>

        {/* ─── Success Content Area ─── */}
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <CheckIcon size={24} color="#059669" />
          </View>
          <Text style={styles.successTitleText}>Expense Recorded</Text>
        </View>

        {/* ─── Success Bottom Actions ─── */}
        <View style={styles.successBottomNav}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => {
              if (onSaveSuccess) onSaveSuccess();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>View Expense</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If in Confirmation step, render confirmation view
  if (isConfirming) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* ─── Top Brand Header Banner ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setIsConfirming(false)}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Expense</Text>
          </View>
        </View>

        <View style={{ flex: 1, backgroundColor: PALETTE.pageBg }} />

        {/* ─── Confirmation Content Area ─── */}
        <View style={styles.confirmBottomSheet}>
          <Text style={styles.confirmHeaderTitle}>Confirm Expense</Text>

          <View style={styles.confirmDetailsBox}>
            <View style={styles.confirmDetailRow}>
              <View style={styles.confirmDetailCol}>
                <Text style={styles.confirmDetailLabel}>Category</Text>
                <Text style={styles.confirmDetailValue}>{selectedCategory}</Text>
              </View>

              <View style={styles.confirmDetailColRight}>
                <Text style={styles.confirmDetailLabel}>Amount</Text>
                <Text style={styles.confirmDetailValue}>₹{amount}</Text>
              </View>
            </View>

            <View style={[styles.confirmDetailRow, { marginTop: 16 }]}>
              <View style={styles.confirmDetailCol}>
                <Text style={styles.confirmDetailLabel}>Payment Method</Text>
                <Text style={styles.confirmDetailValue}>{paymentMethod}</Text>
              </View>
            </View>
          </View>

          {/* Bottom actions row */}
          <View style={styles.confirmActionRow}>
            <TouchableOpacity
              style={styles.confirmSaveBtnRow}
              onPress={handleConfirmSave}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmSaveBtnRowText}>Confirm & Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmCancelBtnRow}
              onPress={() => setIsConfirming(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmCancelBtnRowText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
        </View>
      </View>

      {/* ─── Main Content Scroll Form ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Field 1: Expense Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Expense Category</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownValueText}>{selectedCategory || 'Select Category'}</Text>
            <ChevronDownIcon size={16} color="#1E1612" />
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

          {/* Callout 1: Expense Categories Note */}
          <View style={styles.orangeCallout}>
            <Text style={styles.orangeCalloutText}>
              This list reflects Expense Categories (S06) configuration — never a separately maintained list.
            </Text>
          </View>
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
              placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Field 5: Payment Method */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Payment Method</Text>

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

      <View style={{ height: 40 }} />
    </ScrollView>

    {/* ─── Sticky Footer ─── */}
    <View style={styles.bottomNavForm}>
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSaveExpense}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>Save Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={onBack}
        activeOpacity={0.8}
      >
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>

      {/* ─── Interactive Calendar Picker Modal ─── */}
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
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
                <CloseIcon size={18} color="#6B7280" />
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
                <ChevronLeftIcon size={20} color="#1E1612" />
              </TouchableOpacity>

              <Text style={styles.monthNavTitle}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>

              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handleNextMonth}
                activeOpacity={0.7}
              >
                <ChevronRightIcon size={20} color="#1E1612" />
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },

  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginBottom: 14,
  },
  sectionSubHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginBottom: 8,
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
    marginBottom: 6,
  },

  // ─── Dropdown ───
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownValueText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  pickerDropdown: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  pickerOptionActive: {
    backgroundColor: PALETTE.peachBg,
  },
  pickerOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textDark,
  },
  pickerOptionTextActive: {
    color: PALETTE.primaryDark,
    fontWeight: '800',
  },

  // ─── Date Picker ───
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateValueText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textDark,
  },

  // ─── Amount Input ───
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0562A',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textDark,
    padding: 0,
    margin: 0,
  },

  // ─── Text Areas & Inputs ───
  textAreaInput: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: PALETTE.textDark,
    minHeight: 70,
  },
  textInput: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: PALETTE.textDark,
  },

  // ─── Payment Method Segmented ───
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  paymentMethodBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodBtnActive: {
    backgroundColor: '#F0562A',
    borderColor: '#F0562A',
  },
  paymentMethodText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  paymentMethodTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ─── Upload Boxes ───
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C7BCB0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Callouts ───
  orangeCallout: {
    backgroundColor: '#FDF3E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  orangeCalloutText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8B5E3C',
    lineHeight: 16,
  },
  amberCallout: {
    backgroundColor: PALETTE.amberBg,
    borderWidth: 1,
    borderColor: PALETTE.amberBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  amberCalloutText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.amberText,
    lineHeight: 16,
  },

  // ─── Action Buttons ───
  saveBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0562A',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#F0562A',
  },

  // ─── Bottom Actions ───
  bottomActionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#EBE5DC',
  },

  // ─── Screen Footer ───
  bottomNavForm: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#EBE5DC',
  },
  screenFooterCode: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginVertical: 4,
  },

  // ─── Calendar Modal Styles ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EBE5DC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFE9',
  },
  calHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
  },
  calHeaderSub: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
    marginTop: 2,
  },
  calCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4EFE9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Presets Row
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  presetPill: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBE5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: PALETTE.peachBg,
    borderColor: PALETTE.primary,
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A726C',
  },
  presetPillTextActive: {
    color: PALETTE.primaryDark,
    fontWeight: '800',
  },

  // Month Navigation
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 8,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#EBE5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1612',
  },

  // Weekdays
  weekdaysRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 4,
  },
  weekdayCol: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  // Days Grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  dayCellSelected: {
    backgroundColor: PALETTE.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1612',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayCellTextToday: {
    color: PALETTE.primary,
    fontWeight: '800',
  },

  // Calendar Action Row
  calActionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4EFE9',
    paddingTop: 12,
  },
  calCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE5DC',
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A726C',
  },
  calApplyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ─── Confirmation & Success Layout ───
  confirmBottomSheet: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#EBE5DC',
  },
  confirmHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8B5E3C',
    marginBottom: 12,
  },
  confirmDetailsBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmDetailCol: {
    flex: 1,
  },
  confirmDetailColRight: {
    alignItems: 'flex-start',
  },
  confirmDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  confirmDetailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  confirmActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmSaveBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmSaveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmCancelBtnNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0562A',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtnNewText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#F0562A',
  },
  confirmSaveBtnRow: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSaveBtnRowText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#059669',
  },
  confirmCancelBtnRow: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtnRowText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#4B5563',
  },

  // ─── Success Layout ───
  successContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5F6EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  successBottomNav: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#EBE5DC',
  },
});
