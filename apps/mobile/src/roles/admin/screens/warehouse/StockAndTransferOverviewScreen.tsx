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
  borderLight: '#F3ECE6',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  primarySoft: '#FDF3F0',
  dangerRed: '#E24B4A',
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

function TransferArrowsIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface StockAndTransferOverviewScreenProps {
  onBack?: () => void;
  onInitiateTransfer?: () => void;
  onViewConsolidatedStock?: () => void;
  onViewLowStock?: () => void;
  onViewTransfers?: () => void;
}

export function StockAndTransferOverviewScreen({
  onBack,
  onInitiateTransfer,
  onViewConsolidatedStock,
  onViewLowStock,
  onViewTransfers,
}: StockAndTransferOverviewScreenProps) {
  const CONSOLIDATED_STOCK = [
    { name: 'Ooty', stock: '3,420 KG' },
    { name: 'Coonoor', stock: '3,180 KG' },
    { name: 'Kotagiri', stock: '2,940 KG' },
    { name: 'Gudalur Market', stock: '3,300 KG' },
  ];

  const TRANSFERS_BREAKDOWN = [
    { label: 'Pending', count: '2', isException: false },
    { label: 'In Transit', count: '2', isException: false },
    { label: 'Received', count: '1', isException: false },
    { label: 'Exceptions', count: '1', isException: true },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Top Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTitleRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Stock & Transfer Overview</Text>
        </View>
        <Text style={styles.headerSubtitle}>Consolidated inventory + inter-warehouse transfers</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Consolidated Stock Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Consolidated Stock</Text>
          <TouchableOpacity onPress={onViewConsolidatedStock} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardContainer}>
          {CONSOLIDATED_STOCK.map((item, index) => (
            <React.Fragment key={item.name}>
              <View style={styles.dataRow}>
                <Text style={styles.rowLabel}>{item.name}</Text>
                <Text style={styles.rowValue}>{item.stock}</Text>
              </View>
              {index < CONSOLIDATED_STOCK.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
          <View style={styles.totalDivider} />
          <View style={styles.dataRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>12,840 KG</Text>
          </View>
        </View>

        {/* ─── 2. Low Stock & Surplus Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Low Stock & Surplus</Text>
          <TouchableOpacity onPress={onViewLowStock} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.lowStockCard}
          onPress={onViewLowStock}
          activeOpacity={0.8}
        >
          <Text style={styles.lowStockText}>
            3 products below target · 2 warehouses with surplus available
          </Text>
        </TouchableOpacity>

        {/* ─── 3. Transfers Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Transfers</Text>
          <TouchableOpacity onPress={onViewTransfers} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardContainer}>
          {TRANSFERS_BREAKDOWN.map((item, index) => (
            <React.Fragment key={item.label}>
              <View style={styles.dataRow}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text
                  style={[
                    styles.rowValue,
                    item.isException && { color: PALETTE.dangerRed, fontWeight: '800' },
                  ]}
                >
                  {item.count}
                </Text>
              </View>
              {index < TRANSFERS_BREAKDOWN.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Sticky Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onInitiateTransfer}
          activeOpacity={0.85}
        >
          <TransferArrowsIcon size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Initiate Stock Transfer</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: Platform.OS === 'android' ? 8 : 10,
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    marginLeft: 32,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  cardContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  rowLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  rowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.borderLight,
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: PALETTE.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  lowStockCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  lowStockText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderLight,
  },
  actionBtn: {
    height: 48,
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
