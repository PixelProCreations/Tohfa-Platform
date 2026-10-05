import React from 'react';
import {
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
  pageBg:        '#F4EFE9', // Slightly beige background matching image
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  border:        '#EBE5DC',
  headerBg:      '#F0562A', // Matching header color
};

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12H4M10 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface MainWarehouseTopUpDetailsScreenProps {
  onBack?: () => void;
  details?: {
    transactionId: string;
    customer: string;
    amount: string;
    fiscalCashTag: string;
    processedBy: string;
    status: string;
  };
}

export function MainWarehouseTopUpDetailsScreen({
  onBack,
  details = {
    transactionId: 'WT-20260925-001245',
    customer: 'Rajesh Kumar',
    amount: '₹2,000',
    fiscalCashTag: 'FC-20260925-0012',
    processedBy: 'MWA – Suresh',
    status: 'Completed',
  }
}: MainWarehouseTopUpDetailsScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top-Up Details</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.value}>{details.transactionId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.value}>{details.customer}</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>{details.amount}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Fiscal Cash Tag</Text>
              <Text style={styles.value}>{details.fiscalCashTag}</Text>
            </View>
          </View>

          <View style={[styles.row, { marginBottom: 0 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Processed By</Text>
              <Text style={styles.value}>{details.processedBy}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>{details.status}</Text>
            </View>
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
    backgroundColor: PALETTE.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  col: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 11,
    color: '#7A726C', // Muted text for labels
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1612', // Dark ink text for values
  },
});
