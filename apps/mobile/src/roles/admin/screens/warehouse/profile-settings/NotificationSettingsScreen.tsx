/**
 * Notification preferences of the signed-in warehouse admin (FINAL_LIST #80),
 * for Main and Sub.
 *
 * Was SubWarehouseNotificationSettingsScreen (fourteen separate useState
 * switches). Gate: can('notification.own.view') (`all` for both roles; it
 * covers the admin's own preferences). There is no preferences endpoint or
 * write code yet (SPEC_GAPS W4l-4), so Save only confirms locally.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import { Card, PermissionNote, SectionTitle, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { MenuCard, PROFILE_CODES, profileLayout, SaveIcon, StatusRow } from './ProfileParts';
import type { WarehouseScreenBaseProps } from './types';

type PreferenceKey =
  | 'goodsReceiving'
  | 'inventoryAlerts'
  | 'warehouseOperations'
  | 'taskAlerts'
  | 'exceptionAlerts'
  | 'orderConfirmed'
  | 'orderDispatched'
  | 'orderDelivered'
  | 'walletCredited'
  | 'payoutReleased'
  | 'systemMessages'
  | 'maintenanceMessages'
  | 'securityAlerts';

const PREFERENCE_GROUPS: readonly { title: string; items: readonly { key: PreferenceKey; label: string }[] }[] = [
  {
    title: 'OPERATIONAL NOTIFICATIONS',
    items: [
      { key: 'goodsReceiving', label: 'Goods Receiving' },
      { key: 'inventoryAlerts', label: 'Inventory Alerts' },
      { key: 'warehouseOperations', label: 'Warehouse Operations' },
      { key: 'taskAlerts', label: 'Task / Action Alerts' },
      { key: 'exceptionAlerts', label: 'Exception Alerts' },
    ],
  },
  {
    title: 'ORDER NOTIFICATIONS',
    items: [
      { key: 'orderConfirmed', label: 'Order Confirmed' },
      { key: 'orderDispatched', label: 'Order Dispatched' },
      { key: 'orderDelivered', label: 'Order Delivered' },
    ],
  },
  {
    title: 'WALLET & PAYOUT NOTIFICATIONS',
    items: [
      { key: 'walletCredited', label: 'Wallet Credited' },
      { key: 'payoutReleased', label: 'Payout Released' },
    ],
  },
  {
    title: 'SYSTEM NOTIFICATIONS',
    items: [
      { key: 'systemMessages', label: 'System Messages' },
      { key: 'maintenanceMessages', label: 'Maintenance Messages' },
      { key: 'securityAlerts', label: 'Security Alerts' },
    ],
  },
];

function defaultPreferences(): Record<PreferenceKey, boolean> {
  const all = PREFERENCE_GROUPS.flatMap((group) => group.items.map((item) => item.key));
  return Object.fromEntries(all.map((key) => [key, true])) as Record<PreferenceKey, boolean>;
}

export type NotificationSettingsScreenProps = WarehouseScreenBaseProps;

export function NotificationSettingsScreen({ can, onBack }: NotificationSettingsScreenProps) {
  const [inApp, setInApp] = useState(true);
  const [prefs, setPrefs] = useState<Record<PreferenceKey, boolean>>(defaultPreferences);

  if (!can(PROFILE_CODES.notificationView)) {
    return (
      <WalletScreen title="Notification Settings" onBack={onBack}>
        <View style={profileLayout.scrollContent}>
          <PermissionNote>Your role cannot view notification settings.</PermissionNote>
        </View>
      </WalletScreen>
    );
  }

  const resetDefaults = () => {
    setInApp(true);
    setPrefs(defaultPreferences());
    Alert.alert('Reset', 'Notification preferences restored to default.');
  };

  return (
    <WalletScreen title="Notification Settings" onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.masterRow}>
            <View style={styles.masterText}>
              <Text style={styles.masterTitle}>Receive In-App Notifications</Text>
              <Text style={styles.masterSubtitle}>Master toggle for alerts & sound</Text>
            </View>
            <PreferenceSwitch value={inApp} onValueChange={setInApp} />
          </View>
        </Card>

        {PREFERENCE_GROUPS.map((group) => (
          <React.Fragment key={group.title}>
            <SectionTitle>{group.title}</SectionTitle>
            <MenuCard>
              {group.items.map((item) => (
                <StatusRow
                  key={item.key}
                  label={item.label}
                  right={
                    <PreferenceSwitch
                      value={prefs[item.key]}
                      disabled={!inApp}
                      onValueChange={(next) => setPrefs((prev) => ({ ...prev, [item.key]: next }))}
                    />
                  }
                />
              ))}
            </MenuCard>
          </React.Fragment>
        ))}

        <View style={styles.actions}>
          <WalletButton label="Reset to Default" variant="neutral" onPress={resetDefaults} />
          <WalletButton
            label="Save Preferences"
            icon={<SaveIcon />}
            onPress={() => Alert.alert('Success', 'Notification preferences saved successfully.')}
          />
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

function PreferenceSwitch({
  value,
  onValueChange,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: adminColors.border, true: adminColors.brand }}
      thumbColor={adminColors.card}
    />
  );
}

const styles = StyleSheet.create({
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  masterText: { flex: 1 },
  masterTitle: { ...adminType.rowTitle, color: adminColors.ink },
  masterSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  actions: { gap: adminSpacing.sm, marginTop: adminSpacing.xl },
});
