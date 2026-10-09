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

  green:         '#059669',
  greenBg:       '#DCFCE7',
  greenText:     '#15803D',
  red:           '#DC2626',
  redBg:         '#FEE2E2',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface CashTransactionItem {
  id: string;
  type: 'Cash In' | 'Cash Out';
  title: string;
  ref: string;
  amount: number;
  time: string;
}

const SAMPLE_TRANSACTIONS: CashTransactionItem[] = [
  {
    id: 'TX-01',
    type: 'Cash In',
    title: 'Direct Sale',
    ref: 'Ref: REV-000845',
    amount: 3450,
    time: '11:20 AM',
  },
  {
    id: 'TX-02',
    type: 'Cash In',
    title: 'Cash Top-Up',
    ref: 'Ref: TOP-000512',
    amount: 5000,
    time: '2:15 PM',
  },
  {
    id: 'TX-03',
    type: 'Cash In',
    title: 'Market Day Cash Sale',
    ref: 'Ref: REV-000842',
    amount: 5050,
    time: '4:30 PM',
  },
  {
    id: 'TX-04',
    type: 'Cash Out',
    title: 'Transport Expense',
    ref: 'Ref: EXP-001245',
    amount: 2400,
    time: '09:30 AM',
  },
  {
    id: 'TX-05',
    type: 'Cash Out',
    title: 'Loading / Unloading',
    ref: 'Ref: EXP-001244',
    amount: 1800,
    time: '12:45 PM',
  },
  {
    id: 'TX-06',
    type: 'Cash Out',
    title: 'Generator Fuel / Utilities',
    ref: 'Ref: EXP-001238',
    amount: 2220,
    time: '3:00 PM',
  },
];

export interface SubWarehouseDailyCashScreenProps {
  warehouseName?: string | undefined;
  date?: string | undefined;
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
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

function LockIconSmall({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StoreIcon({ size = 20, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashIcon({ size = 20, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function SubWarehouseDailyCashScreen({
  warehouseName = 'Coonoor Warehouse',
  date = '25 Sep 2026',
  onBack,
  onTabChange,
}: SubWarehouseDailyCashScreenProps) {
  const [actualCash, setActualCash] = useState('21,980');
  const [differenceReason, setDifferenceReason] = useState('');
  const [breakdownTab, setBreakdownTab] = useState<'Cash In' | 'Cash Out'>('Cash In');

  const expectedClosing = 22080;
  const parsedActual = Number(actualCash.replace(/[^0-9.]/g, '')) || 0;
  const difference = parsedActual - expectedClosing;

  const handleTabPress = (tab: SubWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmitReconciliation = () => {
    Alert.alert(
      'Reconciliation Submitted',
      `Daily Cash Reconciliation for ${date} submitted.\nActual Cash: ₹${actualCash}\nDifference: ${difference >= 0 ? '+' : ''}₹${difference}`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onBack) onBack();
          },
        },
      ]
    );
  };

  const filteredTransactions = SAMPLE_TRANSACTIONS.filter((t) => t.type === breakdownTab);

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
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Daily Cash Summary</Text>
            <View style={styles.headerPill}>
              <LockIconSmall size={11} color="#FFFFFF" />
              <Text style={styles.headerPillText}>
                {warehouseName} · {date}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ─── Section 1: Opening Balance ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Opening Balance</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Opening Cash</Text>
            <Text style={styles.cardBigValue}>₹15,000</Text>
          </View>
        </View>

        {/* ─── Section 2: Cash In ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Cash In</Text>
          <View style={styles.card}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Direct Sales</Text>
              <Text style={styles.tableValue}>₹8,500</Text>
            </View>

            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Cash Top-Ups</Text>
              <Text style={styles.tableValue}>₹5,000</Text>
            </View>

            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableTotalLabel}>Total Cash In</Text>
              <Text style={styles.tableTotalValue}>₹13,500</Text>
            </View>
          </View>
        </View>

        {/* ─── Section 3: Cash Out ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Cash Out</Text>
          <View style={styles.card}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Expenses</Text>
              <Text style={styles.tableValue}>₹6,420</Text>
            </View>

            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableTotalLabel}>Total Cash Out</Text>
              <Text style={styles.tableTotalValue}>₹6,420</Text>
            </View>
          </View>
        </View>

        {/* ─── Section 4: Closing Balance ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Closing Balance</Text>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Expected Closing Cash</Text>
            <Text style={styles.cardBigValue}>₹22,080</Text>
          </View>
        </View>

        {/* ─── Section 5: Cash Reconciliation ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Cash Reconciliation</Text>
          <View style={styles.card}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Expected Cash</Text>
              <Text style={styles.tableValue}>₹22,080</Text>
            </View>

            <View style={styles.actualInputWrap}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.actualInput}
                value={actualCash}
                onChangeText={setActualCash}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Difference</Text>
              <Text
                style={[
                  styles.differenceValue,
                  difference < 0 ? { color: PALETTE.red } : { color: PALETTE.greenText },
                ]}
              >
                {difference < 0 ? `-₹${Math.abs(difference)}` : `+₹${difference}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Difference Reason */}
        <View style={styles.sectionWrap}>
          <Text style={styles.fieldLabel}>Difference Reason</Text>
          <TextInput
            style={styles.textAreaInput}
            value={differenceReason}
            onChangeText={setDifferenceReason}
            placeholder="Reason for the difference, if any"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Reconciliation Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmitReconciliation}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>Submit Reconciliation</Text>
        </TouchableOpacity>

        {/* ─── Section 6: Transaction Breakdown ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Transaction Breakdown</Text>

          {/* Breakdown Pills */}
          <View style={styles.breakdownPillsRow}>
            {(['Cash In', 'Cash Out'] as const).map((tab) => {
              const isActive = breakdownTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.breakdownPill, isActive && styles.breakdownPillActive]}
                  onPress={() => setBreakdownTab(tab)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.breakdownPillText,
                      isActive && styles.breakdownPillTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Transaction Cards Container */}
          <View style={styles.card}>
            {filteredTransactions.map((tx, idx) => (
              <React.Fragment key={tx.id}>
                <View style={styles.txRow}>
                  <View style={styles.txIconBox}>
                    {tx.type === 'Cash In' ? (
                      <StoreIcon size={18} color={PALETTE.green} />
                    ) : (
                      <CashIcon size={18} color={PALETTE.primaryDark} />
                    )}
                  </View>

                  <View style={styles.txInfoCol}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txRef}>{tx.ref}</Text>
                  </View>

                  <View style={styles.txAmountCol}>
                    <Text
                      style={[
                        styles.txAmount,
                        tx.type === 'Cash In' ? { color: PALETTE.greenText } : { color: PALETTE.red },
                      ]}
                    >
                      {tx.type === 'Cash In' ? `+₹${tx.amount.toLocaleString()}` : `-₹${tx.amount.toLocaleString()}`}
                    </Text>
                    <Text style={styles.txTime}>{tx.time}</Text>
                  </View>
                </View>

                {idx < filteredTransactions.length - 1 && <View style={styles.tableDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>


    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    gap: 6,
  },
  headerPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
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

  blueCallout: {
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  blueCalloutText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.blueText,
    lineHeight: 16,
  },

  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
    marginBottom: 6,
  },

  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  cardBigValue: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textDark,
  },

  // Table rows
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  tableLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  tableValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  tableTotalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  tableTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.primaryDark,
  },
  tableDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },

  // Reconciliation Input
  actualInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 10,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textDark,
    marginRight: 6,
  },
  actualInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textDark,
    padding: 0,
    margin: 0,
  },
  differenceValue: {
    fontSize: 14,
    fontWeight: '800',
  },

  textAreaInput: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: PALETTE.textDark,
    minHeight: 60,
  },

  submitBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: PALETTE.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Breakdown Pills
  breakdownPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  breakdownPill: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  breakdownPillActive: {
    backgroundColor: PALETTE.peachBg,
    borderColor: PALETTE.primary,
  },
  breakdownPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  breakdownPillTextActive: {
    color: PALETTE.primaryDark,
    fontWeight: '800',
  },

  // Transaction Rows
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PALETTE.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfoCol: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  txRef: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txTime: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    marginTop: 2,
  },

  // Screen Footer
  screenFooterCode: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 4,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
