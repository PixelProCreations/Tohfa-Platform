import React, { useState, useMemo } from 'react';
import {
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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminShadow, adminSpacing } from '../../theme';
import { OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import { AddExpenseScreen } from './AddExpenseScreen';
import { ExpenseRecordDetailScreen } from './ExpenseDetailScreen';

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

function PlusWhiteIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.6"
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

export interface ExpenseManagementRecord {
  id: string;
  expenseCode: string;
  title: string;
  category: string;
  dateStr: string;
  description: string;
  warehouse: string;
  reference: string;
  payee: string;
  amount: number;
  amountFormatted: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentRef: string;
  createdBy: string;
  status: 'Paid' | 'Unpaid' | 'Duplicate reference';
  statusBadge: 'Paid' | 'Unpaid' | 'Duplicate reference';
  documentName?: string;
  documentMeta?: string;
  isSalary?: boolean;
  salaryEmployee?: string;
  salaryRole?: string;
  borderType?: 'alert' | 'warning' | 'default';
}

export const EXPENSES_LIST: ExpenseManagementRecord[] = [
  {
    id: 'exp-7',
    expenseCode: 'EXP-0007',
    title: 'EXP-0007 · Packaging materials',
    category: 'Packaging',
    dateStr: '9 Oct 2026',
    description: 'Packaging boxes and eco wraps for vegetable orders',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'EXPREF-107',
    payee: 'Ooty Eco Packs',
    amount: 3200,
    amountFormatted: '₹3,200.00',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid on 9 Oct 2026',
    paymentRef: 'EPAY-107',
    createdBy: 'Demo Main Warehouse Admin, 9 Oct 2026, 10:15',
    status: 'Paid',
    statusBadge: 'Paid',
    documentName: 'receipt-7.pdf',
    documentMeta: '115 KB · uploaded by Demo Main Warehouse Admin, 9 Oct 2026, 10:15',
    borderType: 'default',
  },
  {
    id: 'exp-9',
    expenseCode: 'EXP-0009',
    title: 'EXP-0009 · Transport',
    category: 'Transport',
    dateStr: '11 Oct 2026',
    description: 'Coonoor vehicle distribution delivery run',
    warehouse: 'Coonoor',
    reference: 'EXPREF-104',
    payee: 'Nilgiri Logistics',
    amount: 1500,
    amountFormatted: '₹1,500.00',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending verification',
    paymentRef: 'EPAY-109',
    createdBy: 'Demo Coonoor Admin, 11 Oct 2026, 09:00',
    status: 'Duplicate reference',
    statusBadge: 'Duplicate reference',
    documentName: 'transport-receipt-9.pdf',
    documentMeta: '95 KB · uploaded by Demo Coonoor Admin, 11 Oct 2026, 09:00',
    borderType: 'alert',
  },
  {
    id: 'emp-7',
    expenseCode: 'EMP-0007',
    title: 'EMP-0007 · Ravi Kumar',
    category: 'Salary',
    dateStr: '05 Oct 2026',
    description: 'Monthly payroll for Warehouse Staff',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'SAL-OCT-07',
    payee: 'Ravi Kumar',
    amount: 18000,
    amountFormatted: '₹18,000.00',
    paymentMethod: 'Direct Bank Transfer',
    paymentStatus: 'Paid on 05 Oct 2026',
    paymentRef: 'SAL-PAY-07',
    createdBy: 'TOHFA HR Admin, 05 Oct 2026, 11:30',
    status: 'Paid',
    statusBadge: 'Paid',
    isSalary: true,
    salaryEmployee: 'Ravi Kumar',
    salaryRole: 'Warehouse Staff · Ooty',
    documentName: 'payslip-emp-0007.pdf',
    documentMeta: '140 KB · uploaded by TOHFA HR Admin, 05 Oct 2026, 11:30',
    borderType: 'default',
  },
  {
    id: 'emp-9',
    expenseCode: 'EMP-0009',
    title: 'EMP-0009 · Suresh',
    category: 'Salary',
    dateStr: 'Oct 2026',
    description: 'Monthly payroll for Quality Control',
    warehouse: 'Coonoor',
    reference: 'SAL-OCT-09',
    payee: 'Suresh',
    amount: 22500,
    amountFormatted: '₹22,500.00',
    paymentMethod: 'Direct Bank Transfer',
    paymentStatus: 'Payment pending',
    paymentRef: 'SAL-PAY-09',
    createdBy: 'TOHFA HR Admin, 05 Oct 2026, 11:35',
    status: 'Unpaid',
    statusBadge: 'Unpaid',
    isSalary: true,
    salaryEmployee: 'Suresh',
    salaryRole: 'Quality Control · Coonoor',
    documentName: 'payslip-emp-0009.pdf',
    documentMeta: '138 KB · uploaded by TOHFA HR Admin, 05 Oct 2026, 11:35',
    borderType: 'warning',
  },
  {
    id: 'exp-1',
    expenseCode: 'EXP-0001',
    title: 'EXP-0001 · Warehouse electricity',
    category: 'Operational category 1 (demo)',
    dateStr: '11 Oct 2026',
    description: 'Demo expense description 1',
    warehouse: 'Ooty',
    reference: 'EXPREF-100',
    payee: 'Demo vendor A',
    amount: 4500,
    amountFormatted: '₹4,500.00',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid on 11 Oct 2026',
    paymentRef: 'EPAY-100',
    createdBy: 'Demo Main Warehouse Admin, 11 Oct 2026, 11:00',
    status: 'Paid',
    statusBadge: 'Paid',
    documentName: 'receipt-1.pdf',
    documentMeta: '120 KB · uploaded by Demo Main Warehouse Admin, 11 Oct 2026, 11:00',
    borderType: 'default',
  },
  {
    id: 'exp-2',
    expenseCode: 'EXP-0002',
    title: 'EXP-0002 · Internet & phone',
    category: 'Operational category 2 (demo)',
    dateStr: '8 Oct 2026',
    description: 'Monthly broadband connectivity',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'EXPREF-102',
    payee: 'Nilgiri Telecom',
    amount: 1800,
    amountFormatted: '₹1,800.00',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid on 8 Oct 2026',
    paymentRef: 'EPAY-102',
    createdBy: 'Demo Main Warehouse Admin, 8 Oct 2026, 14:00',
    status: 'Paid',
    statusBadge: 'Paid',
    documentName: 'telecom-bill.pdf',
    documentMeta: '80 KB · uploaded by Demo Main Warehouse Admin, 8 Oct 2026, 14:00',
    borderType: 'default',
  },
  {
    id: 'exp-3',
    expenseCode: 'EXP-0003',
    title: 'EXP-0003 · Vehicle fuel',
    category: 'Operational category 3 (demo)',
    dateStr: '7 Oct 2026',
    description: 'Diesel for transport vehicle TN-43-A-1200',
    warehouse: 'Coonoor',
    reference: 'EXPREF-103',
    payee: 'HP Fuel Station',
    amount: 5400,
    amountFormatted: '₹5,400.00',
    paymentMethod: 'Card',
    paymentStatus: 'Paid on 7 Oct 2026',
    paymentRef: 'EPAY-103',
    createdBy: 'Demo Coonoor Admin, 7 Oct 2026, 16:30',
    status: 'Paid',
    statusBadge: 'Paid',
    documentName: 'fuel-slip.pdf',
    documentMeta: '65 KB · uploaded by Demo Coonoor Admin, 7 Oct 2026, 16:30',
    borderType: 'default',
  },
  {
    id: 'exp-4',
    expenseCode: 'EXP-0004',
    title: 'EXP-0004 · Loading & unloading',
    category: 'Operational category 4 (demo)',
    dateStr: '6 Oct 2026',
    description: 'Casual labor for morning produce intake',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'EXPREF-104',
    payee: 'Local labor team',
    amount: 2500,
    amountFormatted: '₹2,500.00',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid on 6 Oct 2026',
    paymentRef: 'EPAY-104',
    createdBy: 'Demo Main Warehouse Admin, 6 Oct 2026, 08:30',
    status: 'Paid',
    statusBadge: 'Paid',
    documentName: 'labor-voucher.pdf',
    documentMeta: '90 KB · uploaded by Demo Main Warehouse Admin, 6 Oct 2026, 08:30',
    borderType: 'default',
  },
  {
    id: 'exp-5',
    expenseCode: 'EXP-0005',
    title: 'EXP-0005 · Equipment maintenance',
    category: 'Operational category 5 (demo)',
    dateStr: '10 Oct 2026',
    description: 'Weight scale calibration and cold-room check',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'EXPREF-105',
    payee: 'Precision Agri Tech',
    amount: 6800,
    amountFormatted: '₹6,800.00',
    paymentMethod: 'Invoice / Credit',
    paymentStatus: 'Payment pending',
    paymentRef: 'EPAY-105',
    createdBy: 'Demo Main Warehouse Admin, 10 Oct 2026, 12:00',
    status: 'Unpaid',
    statusBadge: 'Unpaid',
    documentName: 'service-invoice.pdf',
    documentMeta: '210 KB · uploaded by Demo Main Warehouse Admin, 10 Oct 2026, 12:00',
    borderType: 'default',
  },
  {
    id: 'emp-12',
    expenseCode: 'EMP-0012',
    title: 'EMP-0012 · Priya S.',
    category: 'Salary',
    dateStr: '05 Oct 2026',
    description: 'Monthly payroll for Operations Assistant',
    warehouse: 'Main Warehouse, Ooty',
    reference: 'SAL-OCT-12',
    payee: 'Priya S.',
    amount: 16000,
    amountFormatted: '₹16,000.00',
    paymentMethod: 'Direct Bank Transfer',
    paymentStatus: 'Paid on 05 Oct 2026',
    paymentRef: 'SAL-PAY-12',
    createdBy: 'TOHFA HR Admin, 05 Oct 2026, 11:40',
    status: 'Paid',
    statusBadge: 'Paid',
    isSalary: true,
    salaryEmployee: 'Priya S.',
    salaryRole: 'Operations Assistant · Ooty',
    documentName: 'payslip-emp-0012.pdf',
    documentMeta: '135 KB · uploaded by TOHFA HR Admin, 05 Oct 2026, 11:40',
    borderType: 'default',
  },
];

export interface ExpenseManagementScreenProps {
  onBack: () => void;
}

export function ExpenseManagementScreen({ onBack }: ExpenseManagementScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseManagementRecord | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>('exp-9');
  const [showAddExpense, setShowAddExpense] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return EXPENSES_LIST;
    const q = searchQuery.toLowerCase().trim();
    return EXPENSES_LIST.filter(
      (item) =>
        item.expenseCode.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (showAddExpense) {
    return (
      <AddExpenseScreen
        onBack={() => setShowAddExpense(false)}
        onSuccess={() => setShowAddExpense(false)}
      />
    );
  }

  if (selectedExpense) {
    return (
      <ExpenseRecordDetailScreen
        expense={selectedExpense}
        onBack={() => setSelectedExpense(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── 1. Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerLeft}>
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
          <Text style={styles.headerTitle}>Expense Management</Text>
        </View>

        <TouchableOpacity
          style={styles.headerPlusButton}
          onPress={() => setShowAddExpense(true)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Add Expense"
        >
          <PlusWhiteIcon size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 2. Top KPI Grid: 8 Cards ── */}
        <View style={styles.kpiGrid}>
          <OverviewDashboardCard
            title="TOTAL EXPENSES"
            value="₹8,20,000.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="TOTAL SALARY EXPENSES"
            value="₹3,18,200.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="EMPLOYEES"
            value="42"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="RECORDS"
            value="10"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="PAID"
            value="7"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="UNPAID"
            value="3"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="DUPLICATE FLAGS"
            value="1"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="PENDING REVIEW"
            value="Not configured"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValueSubdued}
          />
        </View>

        {/* ── 3. Search & Filter Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color="#786F68" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor="#786F68"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── 4. Counter Line ── */}
        <Text style={styles.counterText}>10 expenses</Text>

        {/* ── 5. Records List ── */}
        {filteredItems.map((item) => {
          const isPaid = item.status === 'Paid';
          const isUnpaid = item.status === 'Unpaid';
          const isDup = item.status === 'Duplicate reference';

          const isSelected = selectedCardId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.recordCard,
                isSelected && (item.borderType === 'warning' ? styles.recordCardWarning : styles.recordCardAlert),
              ]}
              onPress={() => {
                setSelectedCardId(item.id);
                setSelectedExpense(item);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isPaid
                      ? styles.badgeGreen
                      : isUnpaid
                      ? styles.badgeAmber
                      : isDup
                      ? styles.badgeAmber
                      : styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isPaid
                        ? styles.badgeTextGreen
                        : isUnpaid
                        ? styles.badgeTextAmber
                        : isDup
                        ? styles.badgeTextAmber
                        : styles.badgeTextGray,
                    ]}
                  >
                    {item.statusBadge}
                  </Text>
                </View>
              </View>

              {item.isSalary ? (
                <>
                  <Text style={styles.salaryRoleText}>{item.salaryRole}</Text>
                  <Text style={[styles.salaryAmountText, isPaid ? styles.greenAmount : styles.darkAmount]}>
                    {item.amountFormatted}
                  </Text>
                  <Text style={styles.recordLine2}>
                    Salary: Oct 2026 · {isPaid ? 'Paid on 05 Oct 2026' : 'Payment pending'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.recordLine1}>
                    {item.amountFormatted} · {item.warehouse} · {item.dateStr}
                    {item.category ? ` · Category (proposed): ${item.category}` : ''}
                  </Text>
                  {item.borderType === 'alert' ? (
                    <Text style={styles.recordLine2}>Same reference as EXP-0004</Text>
                  ) : null}
                </>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
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
    paddingTop: 8,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPlusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 74,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiTitle: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    color: adminColors.ink,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.3,
  },
  kpiValueSubdued: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.md,
    marginTop: 14,
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
    marginBottom: 10,
  },
  recordCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  recordCardAlert: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  recordCardWarning: {
    borderColor: adminColors.warning.border,
    borderWidth: 1.5,
  },
  recordCardSelected: {
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recordTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeGray: {
    backgroundColor: '#F3F0EA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  recordLine1: {
    fontSize: 12.5,
    color: '#5A524D',
    marginTop: 2,
    lineHeight: 18,
  },
  recordLine2: {
    fontSize: 12,
    color: '#786F68',
    marginTop: 3,
    lineHeight: 16,
  },
  salaryRoleText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
    marginBottom: 4,
  },
  salaryAmountText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  greenAmount: {
    color: '#059669',
  },
  darkAmount: {
    color: '#1F1714',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '92%',
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 14,
  },
  modalCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAE2',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 12.5,
    color: '#6D6761',
    fontWeight: '500',
  },
  detailValueBold: {
    fontSize: 12.5,
    color: adminColors.ink,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  supportingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A4A00',
    marginBottom: 6,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  docMeta: {
    fontSize: 11.5,
    color: '#786F68',
    marginBottom: 16,
  },
  closeBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3A3A3A',
  },
});
