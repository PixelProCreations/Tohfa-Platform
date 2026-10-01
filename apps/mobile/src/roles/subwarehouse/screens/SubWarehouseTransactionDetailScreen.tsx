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

export interface TransactionDetailData {
  transactionId?: string;
  type?: string;
  amount?: string;
  previousBalance?: string;
  newBalance?: string;
  dateTime?: string;
  status?: string;
  warehouse?: string;
  processedBy?: string;
  referenceId?: string;
}

export interface SubWarehouseTransactionDetailScreenProps {
  onBack?: () => void;
  details?: TransactionDetailData;
}

export function SubWarehouseTransactionDetailScreen({
  onBack,
  details = {},
}: SubWarehouseTransactionDetailScreenProps) {
  const transactionId = details.transactionId || 'WT-20260925-001245';
  const type = details.type || 'Cash Top-Up';
  const amount = details.amount || '₹2,000';
  const previousBalance = details.previousBalance || '₹2,500';
  const newBalance = details.newBalance || '₹4,500';
  const dateTime = details.dateTime || 'Today, 10:42 AM';
  const status = details.status || 'Completed';
  const warehouse = details.warehouse || 'Coonoor';
  const processedBy = details.processedBy || 'SWA – Suresh';
  const referenceId = details.referenceId || 'FC-20260925-0012';

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
        <Text style={styles.headerTitle}>Transaction Detail</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailCard}>
          {/* Row 1: Transaction ID & Type */}
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Transaction ID</Text>
              <Text style={styles.fieldValue}>{transactionId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Type</Text>
              <Text style={styles.fieldValue}>{type}</Text>
            </View>
          </View>

          {/* Row 2: Amount & Previous Balance */}
          <View style={[styles.twoColRow, { marginTop: 18 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <Text style={styles.fieldValue}>{amount}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Previous Balance</Text>
              <Text style={styles.fieldValue}>{previousBalance}</Text>
            </View>
          </View>

          {/* Row 3: New Balance & Date/Time */}
          <View style={[styles.twoColRow, { marginTop: 18 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>New Balance</Text>
              <Text style={styles.fieldValue}>{newBalance}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Date/Time</Text>
              <Text style={styles.fieldValue}>{dateTime}</Text>
            </View>
          </View>

          {/* Row 4: Status & Warehouse */}
          <View style={[styles.twoColRow, { marginTop: 18 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>{status}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValue}>{warehouse}</Text>
            </View>
          </View>

          {/* Row 5: Processed By */}
          <View style={[styles.col, { marginTop: 18 }]}>
            <Text style={styles.fieldLabel}>Processed By</Text>
            <Text style={styles.fieldValue}>{processedBy}</Text>
          </View>

          {/* Row 6: Reference ID */}
          <View style={[styles.col, { marginTop: 18 }]}>
            <Text style={styles.fieldLabel}>Reference ID</Text>
            <Text style={styles.fieldValue}>{referenceId}</Text>
          </View>
        </View>
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
  detailCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
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
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
});
