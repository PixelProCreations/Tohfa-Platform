import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  border:        '#EBE5DC',
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

export interface TopUpDetailsData {
  customerName?: string;
  customerId?: string;
  previousBalance?: string;
  topUpAmount?: string;
  newBalance?: string;
  transactionId?: string;
  status?: string;
  type?: string;
  fiscalCashTag?: string;
  dateTime?: string;
  createdBy?: string;
  createdAt?: string;
  warehouse?: string;
}

export interface SubWarehouseTopUpDetailsScreenProps {
  onBack?: () => void;
  details?: TopUpDetailsData;
}

export function SubWarehouseTopUpDetailsScreen({
  onBack,
  details = {},
}: SubWarehouseTopUpDetailsScreenProps) {
  const customerName = details.customerName || 'Ravi Kumar';
  const customerId = details.customerId || 'CUS-001245';
  const previousBalance = details.previousBalance || '₹2,500';
  const topUpAmount = details.topUpAmount || '₹2,000';
  const newBalance = details.newBalance || '₹4,500';
  const transactionId = details.transactionId || 'WT-20260925-001245';
  const status = details.status || 'Completed';
  const type = details.type || 'Cash Top-Up';
  const fiscalCashTag = details.fiscalCashTag || 'FC-20260925-0012';
  const dateTime = details.dateTime || '25 Sep 2026, 10:42 AM';
  const createdBy = details.createdBy || 'SWA – Suresh';
  const createdAt = details.createdAt || '25 Sep 2026, 10:42 AM';
  const warehouse = details.warehouse || 'Coonoor';

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
        <Text style={styles.headerTitle}>Top-Up Details</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Section */}
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{customerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer ID</Text>
              <Text style={styles.fieldValue}>{customerId}</Text>
            </View>
          </View>
        </View>

        {/* Wallet Section */}
        <Text style={styles.sectionTitle}>Wallet</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Previous Balance</Text>
              <Text style={styles.fieldValue}>{previousBalance}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Top-Up Amount</Text>
              <Text style={styles.fieldValue}>{topUpAmount}</Text>
            </View>
          </View>

          <View style={[styles.col, { marginTop: 14 }]}>
            <Text style={styles.fieldLabel}>New Balance</Text>
            <Text style={styles.fieldValue}>{newBalance}</Text>
          </View>
        </View>

        {/* Transaction Section */}
        <Text style={styles.sectionTitle}>Transaction</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Transaction ID</Text>
              <Text style={styles.fieldValue}>{transactionId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>{status}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 14 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Type</Text>
              <Text style={styles.fieldValue}>{type}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Fiscal Cash Tag</Text>
              <Text style={styles.fieldValue}>{fiscalCashTag}</Text>
            </View>
          </View>

          <View style={[styles.col, { marginTop: 14 }]}>
            <Text style={styles.fieldLabel}>Date/Time</Text>
            <Text style={styles.fieldValue}>{dateTime}</Text>
          </View>
        </View>

        {/* Audit Information Section */}
        <Text style={styles.sectionTitle}>Audit Information</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Created By</Text>
              <Text style={styles.fieldValue}>{createdBy}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Created At</Text>
              <Text style={styles.fieldValue}>{createdAt}</Text>
            </View>
          </View>

          <View style={[styles.col, { marginTop: 14 }]}>
            <Text style={styles.fieldLabel}>Warehouse</Text>
            <Text style={styles.fieldValue}>{warehouse}</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
});
