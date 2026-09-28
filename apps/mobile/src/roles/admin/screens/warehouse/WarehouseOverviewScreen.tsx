import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const WAREHOUSE_THEME = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  titleRust: '#7E2E11',
  ink: '#1A1412',
  muted: '#7D7571',
  border: '#EDE8E0',
  orange: '#E85226',
  red: '#C93B27',
  redBorder: '#F87171',
  amberPill: '#7A4B1A',
  amberBorder: '#D4A373',
  trackBg: '#F0ECE6',
  alertBg: '#FEF6E9',
  alertBorder: '#FADCB3',
  alertText: '#92400E',
};

function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={WAREHOUSE_THEME.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon({ color = WAREHOUSE_THEME.red }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilEditIcon({ color = WAREHOUSE_THEME.ink }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface WarehouseOverviewScreenProps {
  onBack?: () => void;
  onSelectWarehouse?: (warehouseName: string) => void;
  onViewLowStock?: () => void;
  onOpenSettings?: () => void;
}

export function WarehouseOverviewScreen({
  onBack,
  onSelectWarehouse,
  onViewLowStock,
  onOpenSettings,
}: WarehouseOverviewScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={WAREHOUSE_THEME.bg} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackChevronIcon />
          </TouchableOpacity>
        )}

        {/* Title Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Warehouse Overview</Text>
          <Text style={styles.subtitle}>Stock utilization across all 4 locations</Text>
        </View>

        {/* Warehouse 1: Ooty Warehouse */}
        <TouchableOpacity
          style={styles.whCard}
          onPress={() => onSelectWarehouse?.('Ooty Warehouse')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.whName}>Ooty Warehouse</Text>
            <Text style={styles.whPercentage}>82%</Text>
          </View>
          <Text style={styles.whMeta}>4 staff on duty · 8,200 / 10,000 kg</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '82%', backgroundColor: WAREHOUSE_THEME.orange }]} />
          </View>
        </TouchableOpacity>

        {/* Warehouse 2: Coonoor Warehouse */}
        <TouchableOpacity
          style={styles.whCard}
          onPress={() => onSelectWarehouse?.('Coonoor Warehouse')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.whName}>Coonoor Warehouse</Text>
            <Text style={styles.whPercentage}>64%</Text>
          </View>
          <Text style={styles.whMeta}>3 staff on duty · 5,100 / 8,000 kg</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '64%', backgroundColor: WAREHOUSE_THEME.orange }]} />
          </View>
        </TouchableOpacity>

        {/* Warehouse 3: Kotagiri Warehouse (Alert State - click anywhere to navigate to Low Stock Alerts) */}
        <TouchableOpacity
          style={[styles.whCard, styles.whCardWarning]}
          onPress={onViewLowStock}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.whName}>Kotagiri Warehouse</Text>
            <Text style={[styles.whPercentage, { color: WAREHOUSE_THEME.red }]}>18%</Text>
          </View>
          <Text style={styles.whMeta}>2 staff on duty · 1,050 / 6,000 kg</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '18%', backgroundColor: WAREHOUSE_THEME.red }]} />
          </View>

          {/* Low Stock Warning Row */}
          <View style={styles.warningActionRow}>
            <WarningTriangleIcon color={WAREHOUSE_THEME.red} />
            <Text style={styles.warningActionText}>Low stock — view alerts</Text>
          </View>
        </TouchableOpacity>

        {/* Warehouse 4: Gudalur Market */}
        <TouchableOpacity
          style={styles.whCard}
          onPress={() => onSelectWarehouse?.('Gudalur Market')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.whName}>Gudalur Market</Text>
            <Text style={styles.whPercentage}>68%</Text>
          </View>
          <Text style={styles.whMeta}>2 staff on duty · 3,400 / 5,000 kg</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '68%', backgroundColor: WAREHOUSE_THEME.orange }]} />
          </View>
        </TouchableOpacity>

        {/* Bottom Button: Warehouse Settings */}
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={onOpenSettings}
          activeOpacity={0.8}
        >
          <PencilEditIcon color={WAREHOUSE_THEME.ink} />
          <Text style={styles.outlineActionBtnText}>Warehouse Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  container: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  contentPad: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    backgroundColor: WAREHOUSE_THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerBlock: {
    marginBottom: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: WAREHOUSE_THEME.titleRust,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: WAREHOUSE_THEME.muted,
    marginTop: 6,
  },
  whCard: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  whCardWarning: {
    borderColor: WAREHOUSE_THEME.redBorder,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whName: {
    fontSize: 17,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  whPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: WAREHOUSE_THEME.titleRust,
  },
  whMeta: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
    marginTop: 4,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: WAREHOUSE_THEME.trackBg,
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  warningActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 4,
  },
  warningActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: WAREHOUSE_THEME.red,
    marginLeft: 6,
  },
  outlineActionBtn: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  outlineActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
    marginLeft: 8,
  },
});
