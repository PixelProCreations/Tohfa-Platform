// Design id: M3S07
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader, SWABottomNav } from '../../swa/components';

export interface StockAllocationDashboardScreenProps extends InventoryScreenBaseProps {}

function LockSmallIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={adminColors.brandDeep} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={adminColors.brandDeep} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function StockTabBoxIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LedgerTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 9h6M9 12.5h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M9 11.5l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StockAllocationDashboardScreen({ scope, can, onNavigate, onBack, onTabChange }: StockAllocationDashboardScreenProps) {
  const allocations = [
    {
      channel: 'ONLINE',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.brand,
      allocated: '420 KG',
      consumed: '180 KG',
      reserved: '120 KG',
      available: '120 KG',
    },
    {
      channel: 'LIVE MARKET',
      titleColor: adminColors.success.text,
      borderColor: adminColors.success.text,
      allocated: '120 KG',
      consumed: '40 KG',
      reserved: '30 KG',
      available: '50 KG',
    },
    {
      channel: 'RESERVE',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.info.text,
      allocated: '80 KG',
      consumed: '20 KG',
      reserved: '20 KG',
      available: '40 KG',
    },
    {
      channel: 'BUFFER',
      titleColor: adminColors.brandDeep,
      borderColor: adminColors.warning.text,
      allocated: '60 KG',
      consumed: '10 KG',
      reserved: '10 KG',
      available: '40 KG',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Stock Allocation"
          onBack={onBack}
          showWarehouse={true}
          warehouseName={scope.warehouseName}
        />

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

          {/* Allocation Tab (Active) */}
          <TouchableOpacity 
            style={[styles.tabCard, styles.activeTabCard]}
            activeOpacity={0.85}
          >
            <AllocationTabIcon color={adminColors.onBrand} />
            <Text style={[styles.tabCardText, styles.activeTabCardText]}>Allocation</Text>
          </TouchableOpacity>

          {/* Verify Tab */}
          <TouchableOpacity 
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S10')}
            activeOpacity={0.7}
          >
            <VerifyTabIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>Verify</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Total Stock Split Header & Multi-color Progress Bar */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Total Stock Split</Text>
            <Text style={styles.sectionSubtitle}>Values from config</Text>
          </View>

          {/* Multi-color Split Bar matching Reference Design */}
          <View style={styles.multiSplitBar}>
            <View style={[styles.splitSegment, { flex: 420, backgroundColor: adminColors.brand }]} />
            <View style={[styles.splitSegment, { flex: 120, backgroundColor: adminColors.success.text }]} />
            <View style={[styles.splitSegment, { flex: 80, backgroundColor: adminColors.info.text }]} />
            <View style={[styles.splitSegment, { flex: 60, backgroundColor: adminColors.warning.text }]} />
          </View>

          {/* 4 Allocation Cards with curved left colored accent */}
          {allocations.map((alloc, index) => (
            <View key={index} style={styles.allocationCard}>
              <View style={[styles.leftAccentStripe, { backgroundColor: alloc.borderColor }]} />
              <View style={styles.cardContent}>
                <Text style={[styles.channelName, { color: alloc.titleColor }]}>
                  {alloc.channel}
                </Text>

                {/* 4 Stat Boxes Row */}
                <View style={styles.statsBoxRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{alloc.allocated}</Text>
                    <Text style={styles.statLabel}>ALLOCATED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{alloc.consumed}</Text>
                    <Text style={styles.statLabel}>CONSUMED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{alloc.reserved}</Text>
                    <Text style={styles.statLabel}>RESERVED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{alloc.available}</Text>
                    <Text style={styles.statLabel}>AVAILABLE</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  warehousePillRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  tabCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  tabCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  activeTabCard: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabCardText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activeTabCardText: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
  },
  multiSplitBar: {
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  splitSegment: {
    height: '100%',
  },
  allocationCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5.5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 14,
  },
  channelName: {
    ...adminType.sectionHead,
    marginBottom: 12,
  },
  statsBoxRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 2,
  },
  statLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.4,
  },
});
