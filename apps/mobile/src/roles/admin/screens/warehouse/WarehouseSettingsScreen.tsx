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
import Svg, { Path, Rect } from 'react-native-svg';
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

function LockIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke="#8A827D" strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#8A827D" strokeWidth="2" />
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

export interface WarehouseSettingsScreenProps {
  onBack?: () => void;
  warehouseName?: string;
  capacityLimit?: string;
  lowStockThreshold?: string;
  operatingHours?: string;
  assignedStaff?: string;
  onEditThresholdHours?: () => void;
}

export function WarehouseSettingsScreen({
  onBack,
  warehouseName = 'Kotagiri Warehouse',
  capacityLimit = '6,000 kg',
  lowStockThreshold = '25%',
  operatingHours = '6:00 AM – 6:00 PM',
  assignedStaff = '2 members',
  onEditThresholdHours,
}: WarehouseSettingsScreenProps) {
  const handleEdit = () => {
    if (onEditThresholdHours) {
      onEditThresholdHours();
    } else {
      Alert.alert(
        'Edit Threshold & Hours',
        `Editing configurations for ${warehouseName}. Sub-warehouse admins can calibrate operating schedules and trigger limits.`
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
          <Text style={styles.title}>Warehouse Settings</Text>
          <Text style={styles.subtitle}>
            {warehouseName} · capacity changes are SA-only
          </Text>
        </View>

        {/* Settings Table Card */}
        <View style={styles.settingsCard}>
          {/* Row 1: Capacity limit */}
          <View style={styles.settingRow}>
            <Text style={styles.rowLabel}>Capacity limit</Text>
            <View style={styles.rowRightLock}>
              <Text style={styles.rowValue}>{capacityLimit}</Text>
              <View style={{ marginLeft: 6 }}>
                <LockIcon />
              </View>
            </View>
          </View>

          {/* Row 2: Low-stock threshold */}
          <View style={styles.settingRow}>
            <Text style={styles.rowLabel}>Low-stock threshold</Text>
            <Text style={[styles.rowValue, styles.rowValueBold]}>{lowStockThreshold}</Text>
          </View>

          {/* Row 3: Operating hours */}
          <View style={styles.settingRow}>
            <Text style={styles.rowLabel}>Operating hours</Text>
            <Text style={[styles.rowValue, styles.rowValueBold]}>{operatingHours}</Text>
          </View>

          {/* Row 4: Assigned staff */}
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <Text style={styles.rowLabel}>Assigned staff</Text>
            <Text style={[styles.rowValue, styles.rowValueBold]}>{assignedStaff}</Text>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <PencilEditIcon color={WAREHOUSE_THEME.ink} />
          <Text style={styles.outlineActionBtnText}>Edit Threshold & Hours</Text>
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
  settingsCard: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    paddingHorizontal: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F1EB',
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    color: '#4A4543',
  },
  rowRightLock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 14,
    color: '#524B48',
  },
  rowValueBold: {
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
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
  },
  outlineActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
    marginLeft: 8,
  },
});
