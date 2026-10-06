import React, { useState } from 'react';
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A', // Brand Orange
  primaryDark: '#D8451B',
  primarySoft: '#FDF1EB',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9', // App canvas soft cream
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  borderSubtle: '#F2ECE5',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#8C8983',
  orangeDeep: '#7A2E14',
  greenSuccess: '#16A34A',
  greenBg: '#DCFCE7',
  amberWarning: '#D97706',
  amberBg: '#FEF3C7',
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

function TrendingUpIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6h6v6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 16, color = PALETTE.greenSuccess }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface WarehousePerformanceScreenProps {
  onBack?: () => void;
  onSelectWarehouse?: (warehouseName: string) => void;
  onViewOperationsHistory?: () => void;
  onViewStaffAttendance?: () => void;
}

export function WarehousePerformanceScreen({
  onBack,
  onSelectWarehouse,
  onViewOperationsHistory,
  onViewStaffAttendance,
}: WarehousePerformanceScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'Today' | 'This Week' | 'This Month'>('Today');

  const PERIODS: ('Today' | 'This Week' | 'This Month')[] = ['Today', 'This Week', 'This Month'];

  const WAREHOUSE_METRICS = [
    {
      name: 'Kotagiri Warehouse',
      city: 'Kotagiri',
      slaRate: '99.2%',
      inboundQty: '1,420 kg',
      outboundQty: '1,280 kg',
      activeBottlenecks: 0,
      utilization: 82,
      perfColor: '#16A34A',
    },
    {
      name: 'Ooty Warehouse',
      city: 'Ooty',
      slaRate: '97.8%',
      inboundQty: '980 kg',
      outboundQty: '940 kg',
      activeBottlenecks: 1,
      utilization: 75,
      perfColor: '#D97706',
    },
    {
      name: 'Coonoor Warehouse',
      city: 'Coonoor',
      slaRate: '98.5%',
      inboundQty: '1,120 kg',
      outboundQty: '1,090 kg',
      activeBottlenecks: 0,
      utilization: 88,
      perfColor: '#16A34A',
    },
  ];

  const SWA_TOP_PERFORMERS = [
    { name: 'Manoj Kumar', role: 'SWA Lead · Kotagiri', taskCount: '24 Receipts Verified', score: '99.8%' },
    { name: 'Arun P', role: 'SWA Dispatch · Ooty', taskCount: '86 Orders Packed', score: '99.2%' },
    { name: 'Priya S', role: 'SWA Inventory · Coonoor', taskCount: '32 Rack Transfers', score: '98.9%' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Brand Orange Theme) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.backBtn}
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Warehouse Performance</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Operational throughput & SLA metrics · All Hubs
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Filter */}
        <View style={styles.periodRow}>
          {PERIODS.map((period) => {
            const isSelected = period === selectedPeriod;
            return (
              <TouchableOpacity
                key={period}
                style={[styles.periodBtn, isSelected && styles.periodBtnActive]}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodBtnText, isSelected && styles.periodBtnTextActive]}>
                  {period}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 4 Top KPI Metric Cards (2x2 Grid) ─── */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Dispatch SLA */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>DISPATCH SLA</Text>
              <View style={styles.kpiBadgeGreen}>
                <Text style={styles.kpiBadgeGreenText}>↑ 1.4%</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>98.6%</Text>
            <Text style={styles.kpiSub}>Target: 95.0% on-time</Text>
          </View>

          {/* Card 2: Putaway Turnaround */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>AVG PUTAWAY</Text>
              <View style={styles.kpiBadgeGreen}>
                <Text style={styles.kpiBadgeGreenText}>↓ 6 min</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>38 min</Text>
            <Text style={styles.kpiSub}>Target: &lt; 45 mins</Text>
          </View>

          {/* Card 3: Fulfillment Accuracy */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>ACCURACY</Text>
              <View style={styles.kpiBadgeNeutral}>
                <Text style={styles.kpiBadgeNeutralText}>Active</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>99.4%</Text>
            <Text style={styles.kpiSub}>2 discrepancies / 340</Text>
          </View>

          {/* Card 4: Utilization */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>EFFICIENCY</Text>
              <View style={styles.kpiBadgeNeutral}>
                <Text style={styles.kpiBadgeNeutralText}>Optimal</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>82%</Text>
            <Text style={styles.kpiSub}>14,200 kg active stock</Text>
          </View>
        </View>

        {/* ─── Warehouse-Wise SLA & Throughput Breakdown ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Warehouse Hub Breakdown</Text>
          <Text style={styles.sectionSubCount}>3 Hubs Monitored</Text>
        </View>

        {WAREHOUSE_METRICS.map((wh) => (
          <TouchableOpacity
            key={wh.name}
            style={styles.whCard}
            onPress={() => onSelectWarehouse && onSelectWarehouse(wh.name)}
            activeOpacity={0.7}
          >
            <View style={styles.whCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.whTitle}>{wh.name}</Text>
                <Text style={styles.whCity}>{wh.city} Hub</Text>
              </View>
              <View style={[styles.slaPill, { backgroundColor: wh.perfColor === '#16A34A' ? '#DCFCE7' : '#FEF3C7' }]}>
                <CheckCircleIcon size={14} color={wh.perfColor} />
                <Text style={[styles.slaPillText, { color: wh.perfColor }]}>{wh.slaRate} SLA</Text>
              </View>
            </View>

            {/* Utilization Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Capacity Utilization</Text>
                <Text style={styles.progressPercent}>{wh.utilization}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${wh.utilization}%`, backgroundColor: wh.perfColor }]} />
              </View>
            </View>

            {/* Bottom Metrics Row */}
            <View style={styles.whStatsRow}>
              <View style={styles.whStatItem}>
                <Text style={styles.whStatLabel}>INBOUND</Text>
                <Text style={styles.whStatValue}>{wh.inboundQty}</Text>
              </View>
              <View style={styles.whStatDivider} />
              <View style={styles.whStatItem}>
                <Text style={styles.whStatLabel}>OUTBOUND</Text>
                <Text style={styles.whStatValue}>{wh.outboundQty}</Text>
              </View>
              <View style={styles.whStatDivider} />
              <View style={styles.whStatItem}>
                <Text style={styles.whStatLabel}>ISSUES</Text>
                <Text
                  style={[
                    styles.whStatValue,
                    wh.activeBottlenecks > 0 && { color: PALETTE.amberWarning },
                  ]}
                >
                  {wh.activeBottlenecks}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* ─── Top Performing SWA Operations Staff ─── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
          <Text style={styles.sectionHeading}>Top Performing Staff</Text>
          {onViewStaffAttendance && (
            <TouchableOpacity onPress={onViewStaffAttendance} activeOpacity={0.7}>
              <Text style={styles.viewLinkText}>All Staff →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.staffCard}>
          {SWA_TOP_PERFORMERS.map((staff, idx) => {
            const isLast = idx === SWA_TOP_PERFORMERS.length - 1;
            return (
              <View
                key={staff.name}
                style={[styles.staffRow, !isLast && styles.staffRowBorder]}
              >
                <View style={styles.staffRankCircle}>
                  <Text style={styles.staffRankText}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  <Text style={styles.staffRole}>{staff.role}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.staffScore}>{staff.score}</Text>
                  <Text style={styles.staffTaskCount}>{staff.taskCount}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Action Button: View Operations History ─── */}
        {onViewOperationsHistory && (
          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={onViewOperationsHistory}
            activeOpacity={0.8}
          >
            <TrendingUpIcon size={18} color={PALETTE.primary} />
            <Text style={styles.outlineActionBtnText}>View Operations Log & History →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#EAE4DA',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  periodBtnActive: {
    backgroundColor: PALETTE.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  periodBtnTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PALETTE.textSecondary,
  },
  kpiBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kpiBadgeGreenText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  kpiBadgeNeutral: {
    backgroundColor: '#F3EFE9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kpiBadgeNeutralText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.5,
  },
  kpiSub: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  sectionSubCount: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  viewLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  whCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  whCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  whTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  whCity: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    marginTop: 1,
  },
  slaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slaPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F3EFE9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  whStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderSubtle,
    paddingTop: 10,
  },
  whStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  whStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: PALETTE.borderSubtle,
  },
  whStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: PALETTE.textMuted,
  },
  whStatValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  staffCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  staffRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderSubtle,
  },
  staffRankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffRankText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  staffName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  staffRole: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 1,
  },
  staffScore: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.greenSuccess,
  },
  staffTaskCount: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  outlineActionBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.primary,
    marginLeft: 8,
  },
});
