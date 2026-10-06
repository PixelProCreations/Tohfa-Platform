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
  primary:       '#F0562A', // Brand Orange
  headerBg:      '#F0562A',
  headerText:    '#FFFFFF',

  orangeDeep:    '#7A2E14', // Section headings
  primarySoft:   '#FDF3F0', // Orange Tint
  pageBg:        '#F3EFE9', // Canvas

  textInk:       '#1A1A1A',
  textSecondary: '#5F5E5A',
  border:        '#EEDCD3', // Card and input borders
  cardBg:        '#FFFFFF',

  capacityBar:   '#F0562A', // Brand Orange
  capacityTrack: '#E5E0D8', // Track background
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

export interface WarehouseCityDetailData {
  city: string;
  swaName: string;
  currentStock: string;
  todaysReceipts: string;
  pendingOrders: string;
  openIssues: string;
  capacityPct: number;
}

export interface WarehouseCityDetailScreenProps {
  warehouseData?: WarehouseCityDetailData;
  cityName?: string;
  onBack?: () => void;
}

const DEFAULT_DATA: Record<string, WarehouseCityDetailData> = {
  Ooty: {
    city: 'Ooty',
    swaName: 'Arun',
    currentStock: '3,420 KG',
    todaysReceipts: '420 KG',
    pendingOrders: '86',
    openIssues: '2',
    capacityPct: 82,
  },
  Coonoor: {
    city: 'Coonoor',
    swaName: 'Priya',
    currentStock: '4,100 KG',
    todaysReceipts: '510 KG',
    pendingOrders: '92',
    openIssues: '3',
    capacityPct: 78,
  },
  Kotagiri: {
    city: 'Kotagiri',
    swaName: 'Manoj',
    currentStock: '2,900 KG',
    todaysReceipts: '380 KG',
    pendingOrders: '64',
    openIssues: '1',
    capacityPct: 70,
  },
  Gudalur: {
    city: 'Gudalur',
    swaName: 'Karthik',
    currentStock: '3,300 KG',
    todaysReceipts: '360 KG',
    pendingOrders: '70',
    openIssues: '1',
    capacityPct: 61,
  },
};

export function WarehouseCityDetailScreen({
  warehouseData,
  cityName = 'Ooty',
  onBack,
}: WarehouseCityDetailScreenProps) {
  // Normalize city name if passed as "Ooty Warehouse"
  const cleanCity = cityName.replace(' Warehouse', '').trim();
  const data = warehouseData || DEFAULT_DATA[cleanCity] || {
    city: cleanCity || 'Ooty',
    swaName: 'Arun',
    currentStock: '3,420 KG',
    todaysReceipts: '420 KG',
    pendingOrders: '86',
    openIssues: '2',
    capacityPct: 82,
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Screenshot 1) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{data.city}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Warehouse 2-Column Info Card ─── */}
        <View style={styles.infoCard}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Warehouse</Text>
              <Text style={styles.gridValue}>{data.city}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>SWA</Text>
              <Text style={styles.gridValue}>{data.swaName}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Current Stock</Text>
              <Text style={styles.gridValue}>{data.currentStock}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Today's Receipts</Text>
              <Text style={styles.gridValue}>{data.todaysReceipts}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Pending Orders</Text>
              <Text style={styles.gridValue}>{data.pendingOrders}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Open Issues</Text>
              <Text style={styles.gridValue}>{data.openIssues}</Text>
            </View>
          </View>
        </View>

        {/* ─── Capacity Usage Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Capacity Usage</Text>
        </View>

        <View style={styles.capacityCard}>
          {/* Capacity Progress Bar */}
          <View style={styles.capacityTrack}>
            <View
              style={[
                styles.capacityFill,
                { width: `${Math.min(data.capacityPct, 100)}%` },
              ]}
            />
          </View>

          <Text style={styles.capacityLabel}>Capacity</Text>
          <Text style={styles.capacityValue}>{data.capacityPct}%</Text>
        </View>

        {/* ─── Disclaimer Notice Box ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Selecting a warehouse shows that warehouse's own data — it never retains figures carried over from the consolidated dashboard.
          </Text>
        </View>

        {/* ─── Back to All Warehouses Button ─── */}
        <TouchableOpacity
          style={styles.backActionButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backActionText}>← Back to All Warehouses</Text>
        </TouchableOpacity>

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
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  capacityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  capacityTrack: {
    height: 12,
    backgroundColor: PALETTE.capacityTrack,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 12,
  },
  capacityFill: {
    height: '100%',
    backgroundColor: PALETTE.capacityBar,
    borderRadius: 100,
  },
  capacityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  capacityValue: {
    fontSize: 18,
    fontWeight: '800', // Bold
    color: PALETTE.textInk,
  },
  noticeBox: {
    backgroundColor: PALETTE.primarySoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
    lineHeight: 18,
  },
  backActionButton: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.2,
    borderColor: PALETTE.primary,
    borderRadius: 12, // MD 12px from Design System PDF
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.primary, // Brand Orange
  },
});
