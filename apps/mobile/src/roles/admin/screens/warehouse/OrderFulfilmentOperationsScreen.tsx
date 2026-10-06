import React from 'react';
import {
  Platform,
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
  headerBg:      '#F0562A',
  headerText:    '#FFFFFF',

  orangeDeep:    '#7A2E14',
  pageBg:        '#F3EFE9',

  textInk:       '#1A1A1A',
  textSecondary: '#5F5E5A',
  border:        '#EEDCD3',
  borderRow:     '#F2ECE5',
  cardBg:        '#FFFFFF',

  redAlert:      '#E24B4A',
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

export interface OrderFulfilmentOperationsScreenProps {
  onBack?: () => void;
  onNavigateOrders?: () => void;
}

export function OrderFulfilmentOperationsScreen({
  onBack,
  onNavigateOrders,
}: OrderFulfilmentOperationsScreenProps) {
  const SUMMARY_ROWS = [
    { label: 'Packing', value: '42', isAlert: false },
    { label: 'Ready for Pickup', value: '86', isAlert: false },
    { label: 'Dispatched', value: '154', isAlert: false },
    { label: 'Exceptions', value: '3', isAlert: true },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Screenshot 3) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Order Fulfilment</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Summary Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Order Fulfilment Summary</Text>
        </View>

        <View style={styles.summaryCard}>
          {SUMMARY_ROWS.map((row, index) => {
            const isLast = index === SUMMARY_ROWS.length - 1;
            return (
              <TouchableOpacity
                key={row.label}
                style={[styles.tableRow, !isLast && styles.tableRowBorder]}
                onPress={onNavigateOrders}
                activeOpacity={0.7}
              >
                <Text style={styles.rowLabel}>{row.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={[
                      styles.rowValue,
                      row.isAlert && { color: PALETTE.redAlert },
                    ]}
                  >
                    {row.value}
                  </Text>
                  <Text style={{ fontSize: 13, color: PALETTE.textSecondary }}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Dispatched Order Quick Card ─── */}
        <TouchableOpacity
          style={styles.orderCard}
          onPress={onNavigateOrders}
          activeOpacity={0.7}
        >
          <View style={styles.iconSquare}>
            <Text style={{ fontSize: 18 }}>📦</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>ORD-88213 · Ooty Warehouse</Text>
            <Text style={styles.cardSub}>Dispatched to customer hub · Tap to inspect</Text>
          </View>
          <Text style={styles.timeText}>09:12 AM</Text>
        </TouchableOpacity>

        {/* ─── Action Button ─── */}
        {onNavigateOrders && (
          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={onNavigateOrders}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomActionText}>View Customer Orders & Dispatches →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderRow,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#FDF3F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  cardSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C8983',
    marginLeft: 8,
  },
  bottomActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
});
