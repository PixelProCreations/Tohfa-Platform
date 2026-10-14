// Design id: M3S09
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { t } from '../../../i18n';
import { ADMIN_BUTTON_HEIGHT, adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { InventoryLiveStateProps, InventoryScreenBaseProps, LowStockRow } from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface LowStockScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  /**
   * The server's LOW_STOCK alerts for the warehouse (GET /admin/alerts?type=LOW_STOCK).
   * The threshold is system_config.low_stock_threshold_kg on the server, never a number in this app.
   */
  items?: readonly LowStockRow[] | undefined;
  /** 'Initiate Transfer' (absorbed from the Main LowStockAlertsScreen). Rendered only with transfer.inter_warehouse.initiate. */
  onInitiateTransfer?: (() => void) | undefined;
}


function TrendingDownIcon({ color = adminColors.danger.text, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 18l-9.5-9.5-5 5L1 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 18h6v-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ color = adminColors.placeholder, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function LowStockScreen({
  scope,
  can,
  onNavigate,
  onBack,
  items = [],
  onInitiateTransfer,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: LowStockScreenProps) {
  // Main (no warehouseId) sees platform-wide rows; Sub sees its own warehouse only.
  const allWarehouses = scope.warehouseId === undefined;
  // rbac: transfer.inter_warehouse.initiate MAIN=all, SUB=none. The Main screen's
  // 'Adjust Thresholds' is NOT carried over: alert.threshold.configure is none
  // for both warehouse roles.
  const canInitiateTransfer = can('transfer.inter_warehouse.initiate');
  const lowStockItems = items;
  const view = queryViewState({ isLoading, error, itemCount: items.length });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Low Stock"
          subtitle={allWarehouses ? 'Platform-wide, below configured threshold' : undefined}
          onBack={onBack}
          showWarehouse={true}
          warehouseName={scope.warehouseName}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
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
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconWrap}>
              <InfoCircleIcon />
            </View>
            <Text style={styles.infoText}>
              Thresholds shown below are read from system configuration — never a fixed number in this app.
            </Text>
          </View>

          {view === 'loading' ? <AdminLoadingState /> : null}
          {view === 'error' ? <AdminErrorState error={error} onRetry={onRetry} /> : null}
          {view === 'empty' ? <AdminEmptyState title={t('inventory.empty.lowStock')} /> : null}

          {/* Low Stock Items matching Image 4 Left */}
          {lowStockItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => onNavigate?.('M3S03', { cropId: item.cropId, grade: item.grade })}
              activeOpacity={0.7}
            >
              <View style={styles.itemRow}>
                <View style={styles.iconWrap}>
                  <TrendingDownIcon color={adminColors.danger.text} size={20} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    Available {item.available} · Configured Threshold {item.threshold}
                  </Text>
                </View>
                <ChevronRightIcon color={adminColors.danger.text} size={18} />
              </View>
            </TouchableOpacity>
          ))}

          {canInitiateTransfer && onInitiateTransfer ? (
            <TouchableOpacity style={styles.transferBtn} onPress={onInitiateTransfer} activeOpacity={0.85}>
              <Text style={styles.transferBtnText}>Initiate Transfer</Text>
            </TouchableOpacity>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  transferBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  transferBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  warehousePillRow: {
    paddingTop: 8,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: adminColors.brandDeep,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.text,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoIconWrap: {
    marginTop: 1,
  },
  infoText: {
    ...adminType.rowTitle,
    flex: 1,
    color: adminColors.info.text,
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderLeftWidth: 4,
    borderLeftColor: adminColors.danger.text,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  itemDetails: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    marginTop: 3,
  },
});
