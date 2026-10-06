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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  primarySoft: '#FDF3F0',
  orangeBar: '#F0562A',
  orangeBg: '#FDF3F0',
  orangeBorder: '#FAD8CF',
  orangeText: '#F0562A',
  green: '#0D684D',
  greenBg: '#EAF3DE',
  greenBorder: '#C4E2C7',
  trackBg: '#EBE5DC',
};

export const WAREHOUSE_THEME = {
  bg: '#F3EFE9',
  cardBg: '#FFFFFF',
  titleRust: '#7A2E14',
  ink: '#1A1A1A',
  muted: '#5F5E5A',
  border: '#EEDCD3',
  orange: '#F0562A',
  red: '#E24B4A',
  redBorder: '#FCA5A5',
  amberPill: '#F0562A',
  amberBorder: '#FAD8CF',
  trackBg: '#EBE5DC',
  alertBg: '#FDF3F0',
  alertBorder: '#FAD8CF',
  alertText: '#7A2E14',
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

function BalanceScaleIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Lucide Scale (exact match to reference design balance scale)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 21h10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3v18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendingUpIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Lucide TrendingUp (exact match to performance chart line)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m22 7-8.5 8.5-5-5L2 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 7h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CircularArrowsIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Lucide RefreshCw (exact match to capacity summary circular arrows)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 3v5h-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 16H3v5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GearSettingsIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  // Lucide Settings (exact match to manage warehouses gear)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export interface WarehouseOverviewScreenProps {
  onBack?: () => void;
  onSelectWarehouse?: (warehouseName: string) => void;
  onViewLowStock?: () => void;
  onOpenSettings?: () => void;
  onNavigateComparison?: () => void;
  onNavigatePerformance?: () => void;
  onNavigateCapacitySummary?: () => void;
  onNavigateManageWarehouses?: () => void;
}

interface WarehouseData {
  id: string;
  name: string;
  capacityPct: number;
  capacityLabel: string;
  barColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  stock: string;
  receipts: string;
  issues: string;
}

const WAREHOUSE_LIST: WarehouseData[] = [
  {
    id: 'ooty',
    name: 'Ooty',
    capacityPct: 82,
    capacityLabel: '82% capacity',
    barColor: PALETTE.orangeBar,
    badgeBg: PALETTE.orangeBg,
    badgeBorder: PALETTE.orangeBorder,
    badgeText: PALETTE.orangeText,
    stock: '3,420 KG',
    receipts: '420 KG',
    issues: '2',
  },
  {
    id: 'coonoor',
    name: 'Coonoor',
    capacityPct: 68,
    capacityLabel: '68% capacity',
    barColor: PALETTE.green,
    badgeBg: PALETTE.greenBg,
    badgeBorder: PALETTE.greenBorder,
    badgeText: PALETTE.green,
    stock: '3,180 KG',
    receipts: '380 KG',
    issues: '3',
  },
  {
    id: 'kotagiri',
    name: 'Kotagiri',
    capacityPct: 74,
    capacityLabel: '74% capacity',
    barColor: PALETTE.orangeBar,
    badgeBg: PALETTE.orangeBg,
    badgeBorder: PALETTE.orangeBorder,
    badgeText: PALETTE.orangeText,
    stock: '2,940 KG',
    receipts: '310 KG',
    issues: '1',
  },
  {
    id: 'gudalur',
    name: 'Gudalur Market',
    capacityPct: 61,
    capacityLabel: '61% capacity',
    barColor: PALETTE.green,
    badgeBg: PALETTE.greenBg,
    badgeBorder: PALETTE.greenBorder,
    badgeText: PALETTE.green,
    stock: '3,300 KG',
    receipts: '360 KG',
    issues: '1',
  },
];

export function WarehouseOverviewScreen({
  onBack,
  onSelectWarehouse,
  onViewLowStock,
  onOpenSettings,
  onNavigateComparison,
  onNavigatePerformance,
  onNavigateCapacitySummary,
  onNavigateManageWarehouses,
}: WarehouseOverviewScreenProps) {
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
          <Text style={styles.headerTitle}>Warehouse Overview</Text>
        </View>
        <Text style={styles.headerSubtitle}>All 4 warehouses at a glance</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 Warehouse Cards */}
        {WAREHOUSE_LIST.map((wh) => (
          <TouchableOpacity
            key={wh.id}
            style={styles.warehouseCard}
            onPress={() => onSelectWarehouse && onSelectWarehouse(`${wh.name} Warehouse`)}
            activeOpacity={0.8}
          >
            {/* Top Row: Name and Capacity Badge */}
            <View style={styles.cardTopRow}>
              <Text style={styles.whName}>{wh.name}</Text>
              <View
                style={[
                  styles.capacityBadge,
                  { backgroundColor: wh.badgeBg, borderColor: wh.badgeBorder },
                ]}
              >
                <Text style={[styles.capacityBadgeText, { color: wh.badgeText }]}>
                  {wh.capacityLabel}
                </Text>
              </View>
            </View>

            {/* Capacity Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${wh.capacityPct}%`, backgroundColor: wh.barColor },
                ]}
              />
            </View>

            {/* 3-Column Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Stock</Text>
                <Text style={styles.statValue}>{wh.stock}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Receipts</Text>
                <Text style={styles.statValue}>{wh.receipts}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Issues</Text>
                <Text style={styles.statValue}>{wh.issues}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* More Views Section */}
        <Text style={styles.moreViewsHeading}>More Views</Text>
        <View style={styles.moreViewsGrid}>
          {/* Comparison */}
          <TouchableOpacity
            style={styles.viewTile}
            onPress={onNavigateComparison ?? (() => onSelectWarehouse && onSelectWarehouse('Ooty Warehouse'))}
            activeOpacity={0.8}
          >
            <BalanceScaleIcon size={22} color={PALETTE.primary} />
            <Text style={styles.viewTileLabel}>Comparison</Text>
          </TouchableOpacity>

          {/* Performance */}
          <TouchableOpacity
            style={styles.viewTile}
            onPress={onNavigatePerformance ?? (() => onSelectWarehouse && onSelectWarehouse('Ooty Warehouse'))}
            activeOpacity={0.8}
          >
            <TrendingUpIcon size={22} color={PALETTE.primary} />
            <Text style={styles.viewTileLabel}>Performance</Text>
          </TouchableOpacity>

          {/* Capacity Summary */}
          <TouchableOpacity
            style={styles.viewTile}
            onPress={onNavigateCapacitySummary ?? onViewLowStock}
            activeOpacity={0.8}
          >
            <CircularArrowsIcon size={22} color={PALETTE.primary} />
            <Text style={styles.viewTileLabel}>Capacity Summary</Text>
          </TouchableOpacity>

          {/* Manage Warehouses */}
          <TouchableOpacity
            style={styles.viewTile}
            onPress={onNavigateManageWarehouses ?? onOpenSettings}
            activeOpacity={0.8}
          >
            <GearSettingsIcon size={22} color={PALETTE.primary} />
            <Text style={styles.viewTileLabel}>Manage Warehouses</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
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

  // ─── Warehouse Cards ───
  warehouseCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  capacityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  capacityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6.5,
    backgroundColor: PALETTE.trackBg,
    borderRadius: 3.25,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3.25,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── More Views ───
  moreViewsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
    marginTop: 10,
    marginBottom: 12,
  },
  moreViewsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  viewTile: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  viewTileLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
  },
});
