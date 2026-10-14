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
  creditGreen:   '#16A34A',
  debitRed:      '#DC2626',
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
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  accountHead: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance: number;
}

const LEDGER_DATA: LedgerEntry[] = [
  {
    id: 'led-1',
    date: '14 Sep 2026',
    description: 'Online Customer Settlement Batch #902',
    accountHead: 'Revenue / Escrow Clearing',
    type: 'CREDIT',
    amount: 124500,
    balance: 1527800,
  },
  {
    id: 'led-2',
    date: '12 Sep 2026',
    description: 'Farmer Payout Direct Disbursement Batch #44',
    accountHead: 'Farmer Payable / Axis Bank',
    type: 'DEBIT',
    amount: 82000,
    balance: 1403300,
  },
  {
    id: 'led-3',
    date: '10 Sep 2026',
    description: 'Ooty Warehouse Solar Power Utility Bill',
    accountHead: 'Operational Expense / Utilities',
    type: 'DEBIT',
    amount: 6850,
    balance: 1485300,
  },
  {
    id: 'led-4',
    date: '08 Sep 2026',
    description: 'Horeca B2B Advance Deposit — Taj Savoy',
    accountHead: 'Customer Advances',
    type: 'CREDIT',
    amount: 50000,
    balance: 1492150,
  },
];

export interface BasicAccountingLedgerScreenProps {
  onBack: () => void;
  onNavigateToAddEntry?: () => void;
}

export function BasicAccountingLedgerScreen({
  onBack,
  onNavigateToAddEntry,
}: BasicAccountingLedgerScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button First */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>Accounting Ledger</Text>
        <Text style={styles.screenSub}>Platform General Ledger · September 2026</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Closing Balance</Text>
          <Text style={styles.balanceAmount}>₹15,27,800</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceSub}>Total Credits: +₹1,74,500</Text>
            <Text style={styles.balanceSub}>·</Text>
            <Text style={[styles.balanceSub, { color: PALETTE.debitRed }]}>
              Total Debits: -₹88,850
            </Text>
          </View>
        </View>

        {/* Entries List */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.entryStack}>
          {LEDGER_DATA.map((entry) => {
            const isCredit = entry.type === 'CREDIT';
            return (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>{entry.date}</Text>
                  <Text
                    style={[
                      styles.entryAmount,
                      isCredit ? styles.creditText : styles.debitText,
                    ]}
                  >
                    {isCredit ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <Text style={styles.entryDesc}>{entry.description}</Text>
                <Text style={styles.accountHead}>Head: {entry.accountHead}</Text>

                <View style={styles.runningBalRow}>
                  <Text style={styles.runningBalLabel}>Running Balance:</Text>
                  <Text style={styles.runningBalVal}>
                    ₹{entry.balance.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Add Entry Button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (onNavigateToAddEntry) onNavigateToAddEntry();
          }}
          activeOpacity={0.8}
        >
          <PlusIcon />
          <Text style={styles.addBtnText}>Add Manual Journal Entry</Text>
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  balanceCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  balanceSub: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.creditGreen,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.titleRust,
    marginBottom: 12,
  },
  entryStack: {
    gap: 12,
    marginBottom: 20,
  },
  entryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
  },
  entryAmount: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  creditText: {
    color: PALETTE.creditGreen,
  },
  debitText: {
    color: PALETTE.debitRed,
  },
  entryDesc: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 3,
  },
  accountHead: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 8,
  },
  runningBalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  runningBalLabel: {
    fontSize: 11,
    color: PALETTE.labelMuted,
  },
  runningBalVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  addBtn: {
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
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
