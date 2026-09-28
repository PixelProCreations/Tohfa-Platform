import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { WAREHOUSE_THEME } from './WarehouseOverviewScreen';

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

function TransferIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"
        stroke="#FFFFFF"
        strokeWidth="2"
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

export interface LowStockAlertItem {
  id: string;
  name: string;
  warehouse: string;
  remainingKg: number;
  thresholdKg: number;
  percentage: number;
  isCritical: boolean; // critical uses red, else amber/brown
}

const DEFAULT_ALERTS: LowStockAlertItem[] = [
  {
    id: '1',
    name: 'Beetroot',
    warehouse: 'Kotagiri Warehouse',
    remainingKg: 42,
    thresholdKg: 350,
    percentage: 12,
    isCritical: true,
  },
  {
    id: '2',
    name: 'Cabbage',
    warehouse: 'Kotagiri Warehouse',
    remainingKg: 63,
    thresholdKg: 300,
    percentage: 21,
    isCritical: true,
  },
  {
    id: '3',
    name: 'Green Tea Leaves',
    warehouse: 'Gudalur Market',
    remainingKg: 76,
    thresholdKg: 200,
    percentage: 38,
    isCritical: false,
  },
];

export interface LowStockAlertsScreenProps {
  onBack?: () => void;
  onInitiateTransfer?: () => void;
  onAdjustThresholds?: () => void;
}

export function LowStockAlertsScreen({
  onBack,
  onInitiateTransfer,
  onAdjustThresholds,
}: LowStockAlertsScreenProps) {
  const handleInitiateTransfer = () => {
    if (onInitiateTransfer) {
      onInitiateTransfer();
    } else {
      Alert.alert(
        'Initiate Transfer',
        'Preparing stock rebalance transfer dispatch from Ooty Central Hub to Kotagiri Warehouse.'
      );
    }
  };

  const handleAdjustThresholds = () => {
    if (onAdjustThresholds) {
      onAdjustThresholds();
    } else {
      Alert.alert(
        'Adjust Thresholds',
        'Threshold configuration mode activated. You can calibrate safety stock triggers for each facility.'
      );
    }
  };

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

        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Low Stock Alerts</Text>
          <Text style={styles.subtitle}>Platform-wide, below configured threshold</Text>
        </View>

        {/* Alert Cards */}
        {DEFAULT_ALERTS.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              alert.isCritical ? styles.alertCardCritical : styles.alertCardWarning,
            ]}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.produceName}>{alert.name}</Text>
              <Text style={styles.whName}>{alert.warehouse}</Text>
              <Text style={styles.thresholdInfo}>
                {alert.remainingKg} kg remaining of {alert.thresholdKg} kg threshold
              </Text>
            </View>

            <View
              style={[
                styles.badgePill,
                alert.isCritical ? styles.badgeCritical : styles.badgeWarning,
              ]}
            >
              <Text style={styles.badgeText}>{alert.percentage}%</Text>
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={handleInitiateTransfer}
          activeOpacity={0.85}
        >
          <TransferIcon />
          <Text style={styles.primaryActionBtnText}>Initiate Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={handleAdjustThresholds}
          activeOpacity={0.8}
        >
          <PencilEditIcon color={WAREHOUSE_THEME.ink} />
          <Text style={styles.outlineActionBtnText}>Adjust Thresholds</Text>
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
  alertCard: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1.2,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  alertCardCritical: {
    borderColor: WAREHOUSE_THEME.redBorder,
  },
  alertCardWarning: {
    borderColor: WAREHOUSE_THEME.amberBorder,
  },
  produceName: {
    fontSize: 16,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  whName: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
    marginTop: 3,
  },
  thresholdInfo: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
    marginTop: 5,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCritical: {
    backgroundColor: WAREHOUSE_THEME.orange,
  },
  badgeWarning: {
    backgroundColor: WAREHOUSE_THEME.amberPill,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  primaryActionBtn: {
    backgroundColor: WAREHOUSE_THEME.orange,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
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
    marginTop: 12,
  },
  outlineActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
    marginLeft: 8,
  },
});
