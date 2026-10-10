/**
 * Warehouse Performance: throughput and SLA across the warehouses (Main only).
 *
 * Gate (FINAL_LIST 127): the screen needs `warehouse.all.view` (MAIN all, SUB
 * none). StorageFlow refuses the route without it and the screen renders a
 * not-available note if opened directly.
 *
 * The Top Performing Staff block is hidden unless the viewer holds
 * `warehouse.staff.list_view`, the warehouse workforce roster code (rbac
 * 1.2.0). FINAL_LIST names `admin.staff.list_view`, but that code is the
 * admin-account list; the ranked people here are warehouse staff and "All
 * Staff" opens the warehouse roster / attendance, so the roster code is the
 * one meant (MAIN holds both, so nothing changes for Main today).
 *
 * KPI targets ("Target: 95.0% on-time") and warehouse tones are row data
 * (fixtures), not thresholds in this screen; warehouse names are looked up by
 * id.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  SectionHint,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { PERFORMANCE_KPIS, storageWarehouseName, TOP_PERFORMERS, WAREHOUSE_PERFORMANCE } from './fixtures';
import { CheckCircleIcon, ProgressBar, STORAGE_CODES, TrendingUpIcon } from './StorageParts';
import type { PerformanceKpi, PerformancePeriod, TopPerformer, WarehousePerformanceRow, WarehouseScreenBaseProps } from './types';

const PERIODS: readonly PerformancePeriod[] = ['Today', 'This Week', 'This Month'];

export interface WarehousePerformanceScreenProps extends WarehouseScreenBaseProps {
  kpis?: readonly PerformanceKpi[] | undefined;
  warehouses?: readonly WarehousePerformanceRow[] | undefined;
  performers?: readonly TopPerformer[] | undefined;
  /** A warehouse card: the host opens that warehouse (by display name, as the Main shell keys it). */
  onSelectWarehouse?: ((warehouseName: string) => void) | undefined;
  onViewOperationsHistory?: (() => void) | undefined;
  /** "All Staff": the warehouse roster / attendance (host). */
  onViewStaffAttendance?: (() => void) | undefined;
}

export function WarehousePerformanceScreen({
  can,
  onBack,
  kpis = PERFORMANCE_KPIS,
  warehouses = WAREHOUSE_PERFORMANCE,
  performers = TOP_PERFORMERS,
  onSelectWarehouse,
  onViewOperationsHistory,
  onViewStaffAttendance,
}: WarehousePerformanceScreenProps) {
  const [period, setPeriod] = useState<PerformancePeriod>('Today');

  if (!can(STORAGE_CODES.allWarehousesView)) {
    return (
      <WalletScreen title="Warehouse Performance" onBack={onBack}>
        <EmptyState title="Warehouse performance not available" subtitle="Your role does not include the all-warehouses view." />
      </WalletScreen>
    );
  }

  const showStaff = can(STORAGE_CODES.staffRoster);

  return (
    <WalletScreen title="Warehouse Performance" subtitle="Operational throughput & SLA metrics · All Hubs" onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <ChipGroup options={PERIODS} value={period} onChange={setPeriod} />

        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <View key={kpi.id} style={styles.kpiCard}>
              <View style={styles.kpiHead}>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <StatusBadge label={kpi.badge} tone={kpi.badgeTone} />
              </View>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiSub}>{kpi.sub}</Text>
            </View>
          ))}
        </View>

        <SectionTitle right={<SectionHint>{warehouses.length} Hubs Monitored</SectionHint>}>Warehouse Hub Breakdown</SectionTitle>
        {warehouses.map((wh) => {
          const name = storageWarehouseName(wh.warehouseId);
          const toneColors = adminColors[wh.tone];
          return (
            <TouchableOpacity
              key={wh.warehouseId}
              style={styles.whCard}
              onPress={() => onSelectWarehouse?.(name)}
              disabled={onSelectWarehouse === undefined}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={name}
            >
              <View style={styles.whHead}>
                <Text style={styles.whTitle}>{name}</Text>
                <View style={[styles.slaPill, { backgroundColor: toneColors.bg }]}>
                  <CheckCircleIcon color={toneColors.text} />
                  <Text style={[styles.slaPillText, { color: toneColors.text }]}>{wh.slaRate} SLA</Text>
                </View>
              </View>
              <View style={styles.progressHead}>
                <Text style={styles.progressLabel}>Capacity Utilization</Text>
                <Text style={styles.progressPercent}>{wh.utilizationPercent}%</Text>
              </View>
              <ProgressBar percent={wh.utilizationPercent} tone={wh.tone === 'warning' ? 'warning' : 'success'} />
              <View style={styles.statsRow}>
                {[
                  { label: 'INBOUND', value: wh.inbound, alert: false },
                  { label: 'OUTBOUND', value: wh.outbound, alert: false },
                  { label: 'ISSUES', value: String(wh.openIssues), alert: wh.openIssues > 0 },
                ].map((stat, index) => (
                  <View key={stat.label} style={[styles.stat, index > 0 && styles.statDivider]}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={[styles.statValue, stat.alert && styles.statValueAlert]}>{stat.value}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {showStaff ? (
          <>
            <SectionTitle
              right={
                onViewStaffAttendance ? (
                  <TouchableOpacity onPress={onViewStaffAttendance} activeOpacity={0.7} accessibilityRole="link">
                    <Text style={styles.link}>All Staff →</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            >
              Top Performing Staff
            </SectionTitle>
            <View style={styles.staffCard}>
              {performers.map((staff, index) => (
                <View key={staff.id} style={[styles.staffRow, index > 0 && styles.staffRowDivider]}>
                  <View style={styles.rank}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.staffText}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffMeta}>
                      {staff.role} · {storageWarehouseName(staff.warehouseId)}
                    </Text>
                  </View>
                  <View style={styles.alignEnd}>
                    <Text style={styles.staffScore}>{staff.score}</Text>
                    <Text style={styles.staffMeta}>{staff.taskCount}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {onViewOperationsHistory ? (
          <WalletButton
            label="View Operations Log & History →"
            variant="outline"
            icon={<TrendingUpIcon />}
            onPress={onViewOperationsHistory}
          />
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: adminSpacing.md, marginBottom: adminSpacing.lg },
  kpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: adminSpacing.xs },
  kpiLabel: { ...adminType.caption, color: adminColors.muted, flexShrink: 1 },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  kpiSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  whCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  whHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.md },
  whTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1, marginRight: adminSpacing.sm },
  slaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  slaPillText: { ...adminType.rowTitle },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { ...adminType.rowMeta, color: adminColors.muted },
  progressPercent: { ...adminType.caption, color: adminColors.ink },
  statsRow: { flexDirection: 'row', marginTop: adminSpacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderLeftColor: adminColors.border },
  statLabel: { ...adminType.caption, color: adminColors.muted },
  statValue: { ...adminType.sectionHead, color: adminColors.ink, marginTop: 2 },
  statValueAlert: { color: adminColors.warning.text },
  link: { ...adminType.rowTitle, color: adminColors.brand },
  staffCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  staffRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: adminSpacing.md },
  staffRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  rank: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { ...adminType.caption, color: adminColors.brandDeep },
  staffText: { flex: 1, marginLeft: 10 },
  staffName: { ...adminType.sectionHead, color: adminColors.ink },
  staffMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  staffScore: { ...adminType.sectionHead, color: adminColors.success.text },
  alignEnd: { alignItems: 'flex-end' },
});
