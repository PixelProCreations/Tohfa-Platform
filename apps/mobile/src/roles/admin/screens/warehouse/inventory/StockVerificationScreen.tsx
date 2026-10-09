// Design id: M3S10
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { adminColors, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';

export interface StockVerificationScreenProps extends InventoryScreenBaseProps {}

// ─── SVG Icons matching Reference Exactly ────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function LockSmallIcon({ size = 13, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="2.2"
      />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function StockTabBoxIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v1.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1.5z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M5 9v9.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V9"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M10 13.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LedgerTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9 3.5v2M15 3.5v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M9 12l2.2 2.2 4.3-4.4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ color = adminColors.ink, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HourglassIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 3h14M5 21h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path
        d="M6 3v3.5a5.5 5.5 0 0 0 2.5 4.5L12 13l3.5-2a5.5 5.5 0 0 0 2.5-4.5V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 21v-3.5a5.5 5.5 0 0 1 2.5-4.5L12 11l3.5 2a5.5 5.5 0 0 1 2.5 4.5V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 18v2.5M9.8 19l-.8 1.5M14.2 19l.8 1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function StockVerificationScreen({ scope, can, onNavigate, onBack }: StockVerificationScreenProps) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Top SafeArea for Caramel Header */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.header}>
          {/* Top Row: Back Arrow + Title */}
          <View style={styles.headerTitleRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Stock Verification</Text>
          </View>

          {/* Warehouse Pill Row inside Header */}
          <View style={styles.warehousePill}>
            <LockSmallIcon size={13} color={adminColors.onBrand} />
            <Text style={styles.warehousePillText}>{scope.warehouseName ?? 'All Warehouses'}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Main Content Area */}
      <View style={styles.body}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 4 Rounded Tab Cards */}
          <View style={styles.tabCardsRow}>
            {/* Stock Tab */}
            <TouchableOpacity
              style={styles.tabCard}
              onPress={() => onNavigate?.('M3S02')}
              activeOpacity={0.7}
            >
              <StockTabBoxIcon color={adminColors.ink} />
              <Text style={styles.tabCardText}>Stock</Text>
            </TouchableOpacity>

            {/* Ledger Tab */}
            <TouchableOpacity
              style={styles.tabCard}
              onPress={() => onNavigate?.('M3S06')}
              activeOpacity={0.7}
            >
              <LedgerTabIcon color={adminColors.ink} />
              <Text style={styles.tabCardText}>Ledger</Text>
            </TouchableOpacity>

            {/* Allocation Tab */}
            <TouchableOpacity
              style={styles.tabCard}
              onPress={() => onNavigate?.('M3S07')}
              activeOpacity={0.7}
            >
              <AllocationTabIcon color={adminColors.ink} />
              <Text style={styles.tabCardText}>Allocation</Text>
            </TouchableOpacity>

            {/* Verify Tab (Active) */}
            <TouchableOpacity
              style={[styles.tabCard, styles.activeTabCard]}
              activeOpacity={0.85}
            >
              <VerifyTabIcon color={adminColors.onBrand} />
              <Text style={[styles.tabCardText, styles.activeTabCardText]}>Verify</Text>
            </TouchableOpacity>
          </View>

          {/* Product Selector Card */}
          <TouchableOpacity style={styles.selectorCard} activeOpacity={0.7}>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorLabel}>PRODUCT</Text>
              <Text style={styles.selectorText}>Tomato · Grade 1</Text>
            </View>
            <ChevronDownIcon color={adminColors.ink} size={20} />
          </TouchableOpacity>

          {/* System Quantity */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Quantity</Text>
          </View>
          <View style={styles.quantityCard}>
            <Text style={styles.quantityValue}>100 KG</Text>
            <Text style={styles.quantityLabel}>SYSTEM QUANTITY</Text>
          </View>

          {/* Verification History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verification History</Text>
          </View>

          {/* History Item 1 */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>24 Sep</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending Review</Text>
              </View>
            </View>
            <Text style={styles.historyProduct}>Tomato</Text>
            <Text style={styles.historyDetails}>
              100 KG → 95 KG · Variance <Text style={styles.varianceBold}>-5 KG</Text>
            </Text>
          </View>

          {/* History Item 2 */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>20 Sep</Text>
              <View style={styles.matchedBadge}>
                <Text style={styles.matchedBadgeText}>Matched</Text>
              </View>
            </View>
            <Text style={styles.historyProduct}>Carrot</Text>
            <Text style={styles.historyDetails}>80 KG → 80 KG</Text>
          </View>

          {/* History Item 3 */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>15 Sep</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </View>
            <Text style={styles.historyProduct}>Beans</Text>
            <Text style={styles.historyDetails}>
              50 KG → 48 KG · Variance <Text style={styles.varianceBold}>-2 KG</Text>
            </Text>
          </View>

          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Start Physical Count Action Button (Anchored at Bottom) */}
        <SafeAreaView style={styles.bottomSafeArea}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => onNavigate?.('M3S11')}
              activeOpacity={0.85}
            >
              <HourglassIcon size={22} color={adminColors.onBrand} />
              <Text style={styles.startButtonText}>Start Physical Count</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  topSafeArea: {
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderWidth: 1,
    borderColor: adminColors.brandDeep,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },
  tabCardsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
  },
  tabCard: {
    flex: 1,
    height: 72,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  activeTabCard: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabCardText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  activeTabCardText: {
    color: adminColors.onBrand,
  },
  selectorCard: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorContent: {
    justifyContent: 'center',
  },
  selectorLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
    letterSpacing: 0.6,
  },
  selectorText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  quantityCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  quantityValue: {
    ...adminType.kpiValue,
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  quantityLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 1,
  },
  historyCard: {
    backgroundColor: adminColors.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  pendingBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  matchedBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchedBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  completedBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  historyProduct: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 6,
    marginBottom: 4,
  },
  historyDetails: {
    ...adminType.body,
    color: adminColors.muted,
  },
  varianceBold: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  bottomSafeArea: {
    backgroundColor: adminColors.card,
  },
  bottomBar: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    height: 54,
    borderRadius: 16,
    gap: 10,
  },
  startButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
