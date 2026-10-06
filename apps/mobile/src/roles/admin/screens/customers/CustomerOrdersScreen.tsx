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
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  amberBg: '#FEF3E2',
  amberText: '#854F0B',
  noticeBgOrange: '#FDF3F0',
  noticeBorderOrange: '#F7CFC4',
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

export interface CustomerOrdersScreenProps {
  customerName?: string;
  onBack?: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export function CustomerOrdersScreen({
  customerName = 'Rajesh Kumar',
  onBack,
  onSelectOrder,
}: CustomerOrdersScreenProps) {
  const KPIS = [
    { label: 'TOTAL', value: '12' },
    { label: 'PENDING', value: '2' },
    { label: 'READY', value: '1' },
    { label: 'COMPLETED', value: '9' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Customer Orders</Text>
        </View>
        <Text style={styles.headerSubtitle}>{customerName}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 KPI Cards */}
        <View style={styles.kpiRow}>
          {KPIS.map((item, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{item.value}</Text>
              <Text style={styles.kpiLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Order Card */}
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => onSelectOrder?.('ORD-00251')}
          activeOpacity={0.8}
        >
          <View style={styles.orderTopRow}>
            <View>
              <Text style={styles.orderId}>ORD-00251</Text>
              <Text style={styles.orderSub}>3 Items</Text>
            </View>
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>Ready for Pickup</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.orderBottomRow}>
            <Text style={styles.whName}>Coonoor</Text>
            <Text style={styles.orderPrice}>₹850</Text>
          </View>
        </TouchableOpacity>

        {/* Disclaimer Note */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Tapping an order opens Module 5's Order Detail — never duplicated here.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 38,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  orderCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  orderSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  readyBadge: {
    backgroundColor: PALETTE.amberBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readyBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.amberText,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whName: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  orderPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  disclaimerBox: {
    backgroundColor: '#FAF8F5',
    borderColor: PALETTE.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    color: PALETTE.textSecondary,
  },
});
