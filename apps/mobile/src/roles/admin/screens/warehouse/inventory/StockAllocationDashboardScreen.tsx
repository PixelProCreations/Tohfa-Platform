// Design id: M3S07
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { isAreaAvailable } from '../availability';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type {
  AllocationChannelKey,
  AllocationDashboard,
  InventoryLiveStateProps,
  InventoryScreenBaseProps,
} from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockAllocationDashboardScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  /** Per-channel totals (GET /admin/allocations, every page). */
  dashboard?: AllocationDashboard | undefined;
  /** Allocation rows behind the totals; 0 = nothing allocated yet. */
  rowCount?: number | undefined;
  /** False when the walk stopped early. */
  complete?: boolean | undefined;
}

/** Card title and accent colours per channel, as the design draws them. */
const CHANNEL_COLORS: Record<AllocationChannelKey, { titleColor: string; borderColor: string }> = {
  online: { titleColor: adminColors.brandDeep, borderColor: adminColors.brand },
  liveMarket: { titleColor: adminColors.success.text, borderColor: adminColors.success.text },
  reserve: { titleColor: adminColors.brandDeep, borderColor: adminColors.info.text },
  buffer: { titleColor: adminColors.brandDeep, borderColor: adminColors.warning.text },
  unknown: { titleColor: adminColors.brandDeep, borderColor: adminColors.border },
};

function kg(grams: number | null): string {
  return grams === null ? t('inventory.noValue') : formatKg(grams);
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

export function StockAllocationDashboardScreen({
  scope,
  can,
  onNavigate,
  onBack,
  dashboard,
  rowCount = 0,
  complete = true,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: StockAllocationDashboardScreenProps) {
  // Stock counts (BR-107) are shown only with inventory.stock_verification.perform (availability.ts).
  const canVerify = isAreaAvailable('stockCounts', can);
  const view = queryViewState({ isLoading, error, itemCount: rowCount });
  const allocations = (dashboard?.channels ?? []).map((summary) => ({ ...summary, ...CHANNEL_COLORS[summary.channel] }));

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

          {/* Verify Tab (gated on stock counts, availability.ts) */}
          {canVerify ? (
          <TouchableOpacity 
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S10')}
            activeOpacity={0.7}
          >
            <VerifyTabIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>Verify</Text>
          </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[adminColors.brand]}
                tintColor={adminColors.brand}
              />
            ) : undefined
          }
        >
          {view === 'loading' ? <AdminLoadingState /> : null}
          {view === 'error' ? <AdminErrorState error={error} onRetry={onRetry} /> : null}
          {view === 'empty' ? <AdminEmptyState title={t('inventory.empty.allocations')} /> : null}
          {view === 'ready' ? (
          <>
          {/* Total Stock Split Header & Multi-color Progress Bar */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Total Stock Split</Text>
            <Text style={styles.sectionSubtitle}>Values from config</Text>
          </View>

          {complete ? null : <Text style={styles.incompleteNote}>{t('inventory.totals.incomplete')}</Text>}

          {/* Multi-color Split Bar: each channel's share of allocated grams, in integer basis points */}
          <View style={styles.multiSplitBar}>
            {allocations
              .filter((alloc) => alloc.shareBasisPoints > 0)
              .map((alloc) => (
                <View
                  key={alloc.channel}
                  style={[styles.splitSegment, { flex: alloc.shareBasisPoints, backgroundColor: alloc.borderColor }]}
                />
              ))}
          </View>

          {/* 4 Allocation Cards with curved left colored accent */}
          {allocations.map((alloc) => (
            <View key={alloc.channel} style={styles.allocationCard}>
              <View style={[styles.leftAccentStripe, { backgroundColor: alloc.borderColor }]} />
              <View style={styles.cardContent}>
                <Text style={[styles.channelName, { color: alloc.titleColor }]}>
                  {alloc.label}
                </Text>

                {/* 4 Stat Boxes Row */}
                <View style={styles.statsBoxRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{kg(alloc.allocatedGrams)}</Text>
                    <Text style={styles.statLabel}>ALLOCATED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{kg(alloc.consumedGrams)}</Text>
                    <Text style={styles.statLabel}>CONSUMED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{kg(alloc.reservedGrams)}</Text>
                    <Text style={styles.statLabel}>RESERVED</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{kg(alloc.availableGrams)}</Text>
                    <Text style={styles.statLabel}>AVAILABLE</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
          </>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  incompleteNote: {
    ...adminType.caption,
    color: adminColors.warning.text,
    marginBottom: adminSpacing.sm,
  },
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
    // The design shows channel names in capitals; the label itself stays translatable.
    textTransform: 'uppercase',
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
