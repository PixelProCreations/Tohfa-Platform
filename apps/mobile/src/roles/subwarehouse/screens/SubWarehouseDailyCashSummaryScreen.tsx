import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
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

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  greenBadge:    '#DCFCE7',
  greenText:     '#15803D',
  amberBadge:    '#FEF3C7',
  amberText:     '#B45309',
  brownBalance:  '#92400E',

  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
};

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

function CalendarIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowDownIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M19 12l-7 7-7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function ExportIcon({ size = 18, color = '#92400E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 6l-4-4-4 4M12 2v13" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export interface SubWarehouseDailyCashSummaryScreenProps {
  onBack?: () => void;
  onViewTopUpHistory?: () => void;
  onNavigateToDailyCash?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
}

export function SubWarehouseDailyCashSummaryScreen({
  onBack,
  onViewTopUpHistory,
  onNavigateToDailyCash,
  onTabChange,
}: SubWarehouseDailyCashSummaryScreenProps) {
  const [physicalCount, setPhysicalCount] = useState('18500');

  const parsedPhysical = parseInt(physicalCount.replace(/[^0-9]/g, '') || '0', 10);
  const variance = parsedPhysical - 18500;

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(8);
  const [tempSelectedDay, setTempSelectedDay] = useState(25);
  const [dateText, setDateText] = useState('Today · 25 Sep 2026');

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); }
  };

  const handleApplyDate = () => {
    setDateText(`${tempSelectedDay} ${MONTH_SHORT[calMonth]} ${calYear}`);
    setShowCalendarModal(false);
  };


  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Cash Summary</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selector Card */}
        <TouchableOpacity
          style={styles.dateSelectorCard}
          onPress={() => setShowCalendarModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.dateSelectorText}>{dateText}</Text>
          <CalendarIcon size={18} color={PALETTE.textSecondary} />
        </TouchableOpacity>

        {/* 3 KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>24</Text>
            <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>23</Text>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>1</Text>
            <Text style={styles.kpiLabel}>PENDING</Text>
          </View>
        </View>

        {/* Total Cash Received Card */}
        <View style={styles.totalCashCard}>
          <Text style={styles.totalCashTitle}>Total Cash Received</Text>
          <Text style={styles.totalCashAmount}>₹18,500</Text>
        </View>

        {/* Cash Breakdown */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cash Breakdown</Text>
          <Text style={styles.sectionSubMuted}>Where recorded</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>₹500 × 3</Text>
            <Text style={styles.denomAmount}>₹1,500</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>₹1,000 × 7</Text>
            <Text style={styles.denomAmount}>₹7,000</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>₹2,000 × 8</Text>
            <Text style={styles.denomAmount}>₹16,000</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>₹5,000 × 1</Text>
            <Text style={styles.denomAmount}>₹5,000</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>Other × 5</Text>
            <Text style={styles.denomAmount}>—</Text>
          </View>
        </View>

        {/* System vs. Physical Cash */}
        <Text style={styles.sectionTitle}>System vs. Physical Cash</Text>
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 18 }]}>
          <Text style={styles.systemCashNumber}>₹18,500</Text>
          <Text style={styles.systemCashLabel}>SYSTEM RECORDED</Text>

          <View style={styles.downArrowWrap}>
            <ArrowDownIcon size={18} color={PALETTE.textSecondary} />
          </View>

          <Text style={styles.systemCashNumber}>₹18,500</Text>
          <Text style={styles.systemCashLabel}>PHYSICAL COUNTED</Text>

          <View style={styles.downArrowWrap}>
            <ArrowDownIcon size={18} color={PALETTE.textSecondary} />
          </View>

          <Text style={styles.varianceNumber}>₹{Math.abs(variance)}</Text>
          <Text style={styles.systemCashLabel}>VARIANCE</Text>
        </View>

        {/* Physical Cash Counted (Screenshot 4) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Physical Cash Counted</Text>
          <Text style={styles.sectionSubMuted}>If supported</Text>
        </View>

        <View style={styles.physicalCountBox}>
          <TextInput
            style={styles.physicalInput}
            value={physicalCount}
            onChangeText={setPhysicalCount}
            keyboardType="numeric"
          />
          <Text style={styles.rupeeSymbol}>₹</Text>
        </View>

        {/* Reconciliation Status */}
        <Text style={styles.sectionTitle}>Reconciliation Status</Text>
        <View style={{ alignItems: 'flex-start', marginTop: 2, marginBottom: 8 }}>
          <TouchableOpacity
            style={styles.reconciledBadge}
            onPress={() => {
              if (onNavigateToDailyCash) onNavigateToDailyCash();
            }}
            activeOpacity={onNavigateToDailyCash ? 0.75 : 1}
          >
            <Text style={styles.reconciledText}>Reconciled · View Details →</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Breakdown */}
        <Text style={styles.sectionTitle}>Transaction Breakdown</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>24</Text>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>1</Text>
            <Text style={styles.kpiLabel}>PENDING</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>0</Text>
            <Text style={styles.kpiLabel}>FAILED</Text>
          </View>
        </View>

        {/* Top-Up List */}
        <Text style={styles.sectionTitle}>Top-Up List</Text>
        <View style={styles.card}>
          <Text style={styles.topUpItemHeader}>10:42 AM · Ravi Kumar</Text>
          <Text style={styles.topUpFiscalCode}>FC-0012</Text>
          <View style={styles.topUpBottomRow}>
            <Text style={styles.topUpAmount}>₹2,000</Text>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </View>
        </View>

        {/* View Full Top-Up History Link */}
        <TouchableOpacity
          style={styles.viewFullHistoryBtn}
          onPress={() => {
            if (onViewTopUpHistory) onViewTopUpHistory();
            else Alert.alert('History', 'Navigating to full history...');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.viewFullHistoryText}>View Full Top-Up History →</Text>
        </TouchableOpacity>

        {/* Export */}
        <Text style={styles.sectionTitle}>Export</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => Alert.alert('Export Summary', 'Exporting daily cash settlement report (PDF/CSV)...')}
          activeOpacity={0.75}
        >
          <ExportIcon size={18} color={PALETTE.brownBalance} />
          <Text style={styles.exportBtnText}>Export Summary</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange ? onTabChange('Home') : (onBack && onBack())}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('Receiving')}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('Inventory')}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>
        <Pressable
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('More')}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>
      
      {/* Calendar Modal Overlay */}
      {showCalendarModal && (
        <Modal transparent animationType="fade" visible={showCalendarModal} onRequestClose={() => setShowCalendarModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.calendarCard}>
              {/* Header */}
              <View style={styles.calHeaderRow}>
                <View>
                  <Text style={styles.calHeaderTitle}>Select Date</Text>
                  <Text style={styles.calHeaderSub}>
                    {tempSelectedDay} {MONTH_NAMES[calMonth]} {calYear}
                  </Text>
                </View>
                <TouchableOpacity style={styles.calCloseBtn} onPress={() => setShowCalendarModal(false)}>
                  <CloseIcon size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Month Navigator */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
                  <ChevronLeftIcon size={20} color="#1E1612" />
                </TouchableOpacity>
                <Text style={styles.monthNavTitle}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>
                <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
                  <ChevronRightIcon size={20} color="#1E1612" />
                </TouchableOpacity>
              </View>

              {/* Weekdays */}
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
                      style={[styles.dayCell, isSelected && styles.dayCellSelected, isToday && !isSelected && styles.dayCellToday]}
                      onPress={() => setTempSelectedDay(dayNum)}
                    >
                      <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected, isToday && !isSelected && styles.dayCellTextToday]}>
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Actions */}
              <View style={styles.calActionRow}>
                <TouchableOpacity style={styles.calCancelBtn} onPress={() => setShowCalendarModal(false)}>
                  <Text style={styles.calCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calApplyBtn} onPress={handleApplyDate}>
                  <Text style={styles.calApplyText}>Apply Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dateSelectorCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  dateSelectorText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  totalCashCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  totalCashTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  totalCashAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionSubMuted: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  denomLabel: {
    fontSize: 13,
    color: PALETTE.textInk,
    fontWeight: '500',
  },
  denomAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },
  systemCashNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: PALETTE.textInk,
  },
  systemCashLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  downArrowWrap: {
    paddingVertical: 6,
  },
  varianceNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: PALETTE.textInk,
  },
  physicalCountBox: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  physicalInput: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    flex: 1,
    paddingVertical: 0,
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  reconciledBadge: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  reconciledText: {
    color: PALETTE.greenText,
    fontSize: 12,
    fontWeight: '700',
  },
  topUpItemHeader: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  topUpFiscalCode: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  topUpBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  topUpAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  completedBadge: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: PALETTE.greenText,
    fontSize: 11.5,
    fontWeight: '700',
  },
  viewFullHistoryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  viewFullHistoryText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.brownBalance,
  },
  exportBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  exportBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.brownBalance,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 7,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 2.5,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  dayCellEmpty: { flex: 1, height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', padding: 20 },
  calendarCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  calHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#1E1612' },
  calHeaderSub: { fontSize: 13, color: '#7A726C', marginTop: 2 },
  calCloseBtn: { padding: 4 },
  monthNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navArrowBtn: { padding: 8 },
  monthNavTitle: { fontSize: 16, fontWeight: '600', color: '#1E1612' },
  weekdaysRow: { flexDirection: 'row', marginBottom: 8 },
  weekdayCol: { flex: 1, alignItems: 'center' },
  weekdayText: { fontSize: 12, fontWeight: '600', color: '#9E9690' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  dayCellSelected: { backgroundColor: '#F0562A' },
  dayCellToday: { backgroundColor: '#FCE7E1' },
  dayCellText: { fontFamily: 'Poppins', fontSize: 14, color: '#29201A' },
  dayCellTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  dayCellTextToday: { color: '#F0562A', fontWeight: 'bold' },
  calActionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  calCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#F0F0F0' },
  calCancelText: { fontFamily: 'Poppins', fontSize: 14, color: '#7A726C', fontWeight: 'bold' },
  calApplyBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#F0562A' },
  calApplyText: { fontFamily: 'Poppins', fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },
});
