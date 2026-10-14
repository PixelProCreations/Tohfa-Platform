import React, { useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314',
  orange:        '#E85226',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  blueBox:       '#EBF5FF',
  blueIcon:      '#1D6FB8',
  pendingBg:     '#FFF3E0',
  pendingText:   '#E65100',
  approvedBg:    '#E8F5E9',
  approvedText:  '#2E7D32',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke="#1A1412"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TruckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
        stroke={PALETTE.blueIcon}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LightningIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke={PALETTE.blueIcon}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WrenchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke={PALETTE.blueIcon}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface ExpenseItem {
  id: string;
  iconType: 'truck' | 'lightning' | 'wrench';
  title: string;
  subtitle: string;
  amount: number;
  status: 'Pending' | 'Approved';
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    iconType: 'truck',
    title: 'Warehouse Maintenance — Ooty',
    subtitle: 'Logged by Kannan V. · Sep 12',
    amount: 4200,
    status: 'Pending',
  },
  {
    id: 'exp-2',
    iconType: 'lightning',
    title: 'Electricity — Coonoor',
    subtitle: 'Logged by Meena R. · Sep 10',
    amount: 6850,
    status: 'Approved',
  },
  {
    id: 'exp-3',
    iconType: 'wrench',
    title: 'Equipment Repair — Kotagiri',
    subtitle: 'Logged by Deepa S. · Sep 8',
    amount: 2100,
    status: 'Pending',
  },
  {
    id: 'exp-4',
    iconType: 'truck',
    title: 'Inter-warehouse Transport — Gudalur',
    subtitle: 'Logged by Murugan T. · Sep 6',
    amount: 3500,
    status: 'Pending',
  },
];

export interface ExpensesScreenProps {
  onBack: () => void;
  onNavigateToAddExpense: () => void;
}

export function ExpensesScreen({
  onBack,
  onNavigateToAddExpense,
}: ExpensesScreenProps) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [selectedIds, setSelectedIds] = useState<string[]>(['exp-1', 'exp-3']);

  function toggleSelect(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function handleApproveSelected() {
    if (selectedIds.length === 0) {
      Alert.alert('No Selection', 'Please select at least one pending expense to approve.');
      return;
    }

    setExpenses((prev) =>
      prev.map((e) => (selectedIds.includes(e.id) ? { ...e, status: 'Approved' } : e))
    );
    setSelectedIds([]);
    Alert.alert(
      'Expenses Approved',
      `Successfully approved ${selectedIds.length} operational expense vouchers.`,
      [{ text: 'OK' }]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Action Row: Back Button on left, Add Button on right */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <BackChevronIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={onNavigateToAddExpense}
            activeOpacity={0.7}
          >
            <PlusIcon />
          </TouchableOpacity>
        </View>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>Expenses</Text>
        <Text style={styles.screenSub}>18 awaiting approval · this month</Text>

        {/* Expense Cards */}
        <View style={styles.expenseList}>
          {expenses.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isApproved = item.status === 'Approved';

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.expenseCard,
                  isSelected && styles.expenseCardSelected,
                ]}
                onPress={() => {
                  if (!isApproved) toggleSelect(item.id);
                }}
                activeOpacity={isApproved ? 1 : 0.75}
              >
                {/* Left Icon Square */}
                <View style={styles.iconBox}>
                  {item.iconType === 'truck' && <TruckIcon />}
                  {item.iconType === 'lightning' && <LightningIcon />}
                  {item.iconType === 'wrench' && <WrenchIcon />}
                </View>

                {/* Details Col */}
                <View style={styles.detailsCol}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSub}>{item.subtitle}</Text>

                  {/* Status Pill */}
                  <View style={styles.pillRow}>
                    <View
                      style={[
                        styles.statusPill,
                        isApproved ? styles.approvedPill : styles.pendingPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isApproved ? styles.approvedPillText : styles.pendingPillText,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Amount on Right */}
                <Text style={styles.amountText}>
                  ₹{item.amount.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Button: Approve Selected */}
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={handleApproveSelected}
          activeOpacity={0.8}
        >
          <CheckmarkIcon />
          <Text style={styles.approveBtnText}>Approve Selected</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  expenseList: {
    gap: 12,
    marginBottom: 24,
  },
  expenseCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseCardSelected: {
    borderColor: PALETTE.orange,
    backgroundColor: '#FFFAF7',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: PALETTE.blueBox,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailsCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 3,
  },
  itemSub: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pendingPill: {
    backgroundColor: PALETTE.pendingBg,
  },
  pendingPillText: {
    color: PALETTE.pendingText,
    fontSize: 11,
    fontWeight: '700',
  },
  approvedPill: {
    backgroundColor: PALETTE.approvedBg,
  },
  approvedPillText: {
    color: PALETTE.approvedText,
    fontSize: 11,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.ink,
    marginLeft: 8,
  },
  approveBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
