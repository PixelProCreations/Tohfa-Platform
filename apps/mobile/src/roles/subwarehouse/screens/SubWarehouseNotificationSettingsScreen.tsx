import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F3EFEA',

  categoryTitle: '#8B5E3C',
  greenText:     '#15803D',
  greenBg:       '#DCFCE7',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function SaveDiskIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export interface SubWarehouseNotificationSettingsScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

export function SubWarehouseNotificationSettingsScreen({
  onBack,
  onTabChange,
}: SubWarehouseNotificationSettingsScreenProps) {
  // Master switch
  const [inAppNotif, setInAppNotif] = useState(true);

  // Operational
  const [goodsReceiving, setGoodsReceiving] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [warehouseOperations, setWarehouseOperations] = useState(true);
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [exceptionAlerts, setExceptionAlerts] = useState(true);

  // Order
  const [orderConfirmed, setOrderConfirmed] = useState(true);
  const [orderDispatched, setOrderDispatched] = useState(true);
  const [orderDelivered, setOrderDelivered] = useState(true);

  // Wallet & Payout
  const [walletCredited, setWalletCredited] = useState(true);
  const [payoutReleased, setPayoutReleased] = useState(true);

  // System
  const [systemMessages, setSystemMessages] = useState(true);
  const [maintenanceMessages, setMaintenanceMessages] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const handleResetDefaults = () => {
    setInAppNotif(true);
    setGoodsReceiving(true);
    setInventoryAlerts(true);
    setWarehouseOperations(true);
    setTaskAlerts(true);
    setExceptionAlerts(true);
    setOrderConfirmed(true);
    setOrderDispatched(true);
    setOrderDelivered(true);
    setWalletCredited(true);
    setPayoutReleased(true);
    setSystemMessages(true);
    setMaintenanceMessages(true);
    setSecurityAlerts(true);
    Alert.alert('Reset', 'Notification preferences restored to default.');
  };

  const handleSavePreferences = () => {
    Alert.alert('Success', 'Notification preferences saved successfully.');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (onBack) onBack();
            }}
            activeOpacity={0.75}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Notification Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master In-App Notifications Card */}
        <View style={styles.masterCard}>
          <View style={styles.masterLeft}>
            <Text style={styles.masterTitle}>Receive In-App Notifications</Text>
            <Text style={styles.masterSub}>Master toggle for alerts & sound</Text>
          </View>
          <Switch
            value={inAppNotif}
            onValueChange={setInAppNotif}
            trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Section 1: OPERATIONAL NOTIFICATIONS */}
        <Text style={styles.sectionHeading}>OPERATIONAL NOTIFICATIONS</Text>
        <View style={styles.menuCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Goods Receiving</Text>
            <Switch
              value={goodsReceiving}
              onValueChange={setGoodsReceiving}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Inventory Alerts</Text>
            <Switch
              value={inventoryAlerts}
              onValueChange={setInventoryAlerts}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Warehouse Operations</Text>
            <Switch
              value={warehouseOperations}
              onValueChange={setWarehouseOperations}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Task / Action Alerts</Text>
            <Switch
              value={taskAlerts}
              onValueChange={setTaskAlerts}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Exception Alerts</Text>
            <Switch
              value={exceptionAlerts}
              onValueChange={setExceptionAlerts}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 2: ORDER NOTIFICATIONS */}
        <Text style={styles.sectionHeading}>ORDER NOTIFICATIONS</Text>
        <View style={styles.menuCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Order Confirmed</Text>
            <Switch
              value={orderConfirmed}
              onValueChange={setOrderConfirmed}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Order Dispatched</Text>
            <Switch
              value={orderDispatched}
              onValueChange={setOrderDispatched}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Order Delivered</Text>
            <Switch
              value={orderDelivered}
              onValueChange={setOrderDelivered}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 3: WALLET & PAYOUT NOTIFICATIONS */}
        <Text style={styles.sectionHeading}>WALLET & PAYOUT NOTIFICATIONS</Text>
        <View style={styles.menuCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Wallet Credited</Text>
            <Switch
              value={walletCredited}
              onValueChange={setWalletCredited}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Payout Released</Text>
            <Switch
              value={payoutReleased}
              onValueChange={setPayoutReleased}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 4: SYSTEM NOTIFICATIONS */}
        <Text style={styles.sectionHeading}>SYSTEM NOTIFICATIONS</Text>
        <View style={styles.menuCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>System Messages</Text>
            <Switch
              value={systemMessages}
              onValueChange={setSystemMessages}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Maintenance Messages</Text>
            <Switch
              value={maintenanceMessages}
              onValueChange={setMaintenanceMessages}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Security Alerts</Text>
            <Switch
              value={securityAlerts}
              onValueChange={setSecurityAlerts}
              disabled={!inAppNotif}
              trackColor={{ false: '#E5E7EB', true: PALETTE.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Reset to Default Button */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetDefaults}
          activeOpacity={0.75}
        >
          <Text style={styles.resetBtnText}>Reset to Default</Text>
        </TouchableOpacity>

        {/* Save Preferences Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSavePreferences}
          activeOpacity={0.85}
        >
          <SaveDiskIcon size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  masterCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  masterLeft: {
    flex: 1,
    paddingRight: 10,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  masterSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.categoryTitle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginHorizontal: 16,
  },
  resetBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  resetBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  saveBtn: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
