import React, { useState } from 'react';
import { MainWarehouseTopUpDetailsScreen } from './MainWarehouseTopUpDetailsScreen';
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
  pageBg:        '#F7F4EF',
  cardBg:        '#FFFFFF',
  textInk:       '#000000',
  textSecondary: '#6B7280',
  border:        '#EAE5DF',
  greenBadge:    '#E0F2E9',
  greenText:     '#008060',
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

export interface MainWarehouseTopUpHistoryScreenProps {
  onBack?: () => void;
}

export function MainWarehouseTopUpHistoryScreen({
  onBack,
}: MainWarehouseTopUpHistoryScreenProps) {
  const [selectedTx, setSelectedTx] = useState(false);

  if (selectedTx) {
    return <MainWarehouseTopUpDetailsScreen onBack={() => setSelectedTx(false)} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

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
        <Text style={styles.headerTitle}>Top-Up History</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Cards Row */}
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>12</Text>
            <Text style={styles.metricLabel}>TOP-UPS</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>₹18,500</Text>
            <Text style={styles.metricLabel}>CASH</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>11</Text>
            <Text style={styles.metricLabel}>SUCCESS</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>1</Text>
            <Text style={styles.metricLabel}>FAILED</Text>
          </View>
        </View>

        {/* Transaction Card */}
        <TouchableOpacity style={styles.txCard} activeOpacity={0.7} onPress={() => setSelectedTx(true)}>
          <View style={styles.txTopRow}>
            <Text style={styles.txIdText}>WT-20260925-001245</Text>
            <View style={styles.badgeCompleted}>
              <Text style={styles.textCompleted}>Completed</Text>
            </View>
          </View>
          <Text style={styles.txCustomerText}>Rajesh Kumar · CUS-001245</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.txBottomRow}>
            <Text style={styles.txDescText}>Cash Top-Up · Coonoor</Text>
            <Text style={styles.txAmountText}>₹2,000</Text>
          </View>
        </TouchableOpacity>
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
    backgroundColor: '#F0562A',
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
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  metricNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 4,
  },
  txCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  badgeCompleted: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textCompleted: {
    color: PALETTE.greenText,
    fontSize: 11,
    fontWeight: '700',
  },
  txCustomerText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 14,
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDescText: {
    fontSize: 12,
    color: PALETTE.textInk,
  },
  txAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#A0522D',
  },
});
