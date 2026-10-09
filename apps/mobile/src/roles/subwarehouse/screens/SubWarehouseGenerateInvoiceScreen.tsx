import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { InvoiceTransactionRecord } from '../../admin/screens/warehouse/billing-invoices/types';

// ─── Design Tokens (#F0562A Brand + Inspect Element Tokens) ─────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#5C6B63',
  border:        '#E7E2D6',
  divider:       '#F0ECE3',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
  redBadge:      '#FEE2E2',
  redText:       '#DC2626',
  selectBtnBg:   '#FFF0EB',
  selectBtnText: '#F0562A',
};


const TRANSACTIONS: InvoiceTransactionRecord[] = [
  {
    id: 'ORD-002154',
    customerName: 'Ravi Kumar',
    amount: '₹2,450',
    status: 'Completed',
    saleType: 'Retail Sale',
  },
  {
    id: 'ORD-002150',
    customerName: 'Priya Stores',
    amount: '₹1,100',
    status: 'Invoice Exists',
    saleType: 'B2B Sale',
  },
];

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

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

function SearchIcon({ size = 18, color = '#8A928D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

import { SubWarehouseInvoiceWizardScreen } from './SubWarehouseInvoiceWizardScreen';

export interface SubWarehouseGenerateInvoiceScreenProps {
  onBack?: () => void;
  onSelectTransaction?: (transaction: InvoiceTransactionRecord) => void;
  onNavigateToGSTInvoice?: () => void;
}

export function SubWarehouseGenerateInvoiceScreen({
  onBack,
  onSelectTransaction,
  onNavigateToGSTInvoice,
}: SubWarehouseGenerateInvoiceScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<InvoiceTransactionRecord | null>(null);

  const filtered = TRANSACTIONS.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.customerName.toLowerCase().includes(q)
    );
  });

  const handleSelect = (tx: InvoiceTransactionRecord) => {
    if (tx.saleType.includes('B2B') && onNavigateToGSTInvoice) {
      onNavigateToGSTInvoice();
      return;
    }

    if (onSelectTransaction) {
      onSelectTransaction(tx);
    } else {
      setSelectedTx(tx);
    }
  };

  if (selectedTx) {
    return (
      <SubWarehouseInvoiceWizardScreen
        transaction={selectedTx as any}
        onBack={() => setSelectedTx(null)}
        onSuccess={() => {
          Alert.alert('Invoice Generated', `Invoice generated successfully for ${selectedTx.customerName}.`);
          setSelectedTx(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Generate Invoice</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeading}>Select Transaction</Text>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order ID / Sale ID"
            placeholderTextColor="#8A928D"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* ─── Transaction Cards ─── */}
        {filtered.map((tx) => {
          const isCompleted = tx.status === 'Completed';
          return (
            <TouchableOpacity
              key={tx.id}
              style={styles.card}
              onPress={() => {
                if (!isCompleted && onNavigateToGSTInvoice) {
                  onNavigateToGSTInvoice();
                }
              }}
              activeOpacity={isCompleted ? 1 : 0.75}
            >
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.orderIdText}>{tx.id}</Text>
                  <Text style={styles.customerText}>{tx.customerName}</Text>
                </View>

                <View style={isCompleted ? styles.completedBadge : styles.existsBadge}>
                  <Text style={isCompleted ? styles.completedBadgeText : styles.existsBadgeText}>
                    {tx.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardAmountRow}>
                <Text style={styles.amountText}>{tx.amount}</Text>
              </View>

              {/* Select Button for All */}
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => handleSelect(tx)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectBtnText}>Select</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: PALETTE.pageBg,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 13,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIdText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  customerText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  completedBadge: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  completedBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  existsBadge: {
    backgroundColor: PALETTE.redBadge,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  existsBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.redText,
  },
  cardAmountRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 10,
  },
  amountText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  selectBtn: {
    backgroundColor: PALETTE.selectBtnBg,
    borderRadius: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.selectBtnText,
  },
});
