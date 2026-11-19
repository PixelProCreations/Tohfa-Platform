/**
 * Warehouse Contact for the Main and Sub warehouse admins (FINAL_LIST #87).
 *
 * Was roles/subwarehouse SubWarehouseContactScreen. Gate: none. Read-only for
 * both roles here: the contact-phone edit (PATCH /warehouses/{id},
 * warehouse.profile.edit) is `none` for a Sub admin, and Main's edit is a
 * later phase. Sub sees its own warehouse (locked pill); Main picks one in the
 * header selector.
 *
 * Live (plan phase 8): the phone and the address come from GET
 * /warehouses/{id} (`contactPhone`, address / city / pincode). Call and
 * Directions open the device dialer and maps (Linking), each only when its
 * value is set.
 *
 * The e-mail, the contact person and the emergency contact are design rows the
 * warehouse record has no field for: they render the em-dash placeholder rather
 * than disappearing. Not ported: the per-row "Copy" buttons (no clipboard
 * module is installed, SPEC_GAPS W4m-3).
 */
import React from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { InfoCard, SectionTitle, WalletButton, WalletScreen, WarehouseTabBar } from '../wallet-cashtopup/WalletParts';
import type { WarehouseProfileView, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import {
  DirectionsIcon,
  LinkCard,
  MailIcon,
  MapFoldedIcon,
  PhoneIcon,
  singleWarehouseId,
  SingleWarehouseHeader,
  warehouseProfileLayout,
} from './WarehouseProfileParts';

export interface ContactScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  /** The live warehouse (GET /warehouses/{id}); undefined until it loads. */
  profile?: WarehouseProfileView | undefined;
  /** There is no warehouse the API knows to ask for (Main with a sample selection). */
  unavailable?: boolean | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
}

function call(phone: string) {
  Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => Alert.alert(t('profile.help.callTitle'), phone));
}

export function ContactScreen({
  scope,
  onBack,
  onTabChange,
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
  profile,
  unavailable = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: ContactScreenProps) {
  const headerWarehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const state = unavailable ? 'unavailable' : profile !== undefined ? 'ready' : queryViewState({ isLoading, error, itemCount: 0 });
  const noValue = t('profile.noValue');
  const mapTarget = profile?.address ?? profile?.coordinates ?? null;

  const directions = () => {
    if (mapTarget === null) return;
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(mapTarget)}`).catch(() =>
      Alert.alert(t('profile.warehouse.directionsTitle'), mapTarget),
    );
  };

  return (
    <WalletScreen
      title="Warehouse Contact"
      onBack={onBack}
      headerExtra={
        <SingleWarehouseHeader scope={scope} warehouseId={headerWarehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      {state === 'unavailable' ? (
        <AdminEmptyState title={t('profile.warehouse.unavailable')} />
      ) : state === 'loading' ? (
        <AdminLoadingState />
      ) : state !== 'ready' || profile === undefined ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : (
        <ScrollView
          contentContainerStyle={warehouseProfileLayout.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined}
        >
          <SectionTitle>Primary Contact</SectionTitle>
          <InfoCard rows={[[{ label: 'Phone', value: profile.contactPhone ?? noValue }], [{ label: 'Email', value: noValue }]]} />

          <SectionTitle>Contact Person</SectionTitle>
          <InfoCard
            rows={[
              [
                { label: 'Name', value: noValue },
                { label: 'Role', value: noValue },
              ],
              [{ label: 'Phone', value: noValue }],
            ]}
          />

          <SectionTitle>Address</SectionTitle>
          <InfoCard rows={[[{ label: 'Warehouse Address', value: profile.address ?? noValue }]]} />
          <View style={warehouseProfileLayout.gap} />
          <LinkCard icon={<MapFoldedIcon />} title="Map Preview" actionLabel="Open in Maps" onPress={directions} />

          <SectionTitle>Contact Actions</SectionTitle>
          <View style={styles.actions}>
            <ActionButton
              icon={<PhoneIcon size={16} color={adminColors.brandDeep} />}
              label="Call"
              onPress={() => {
                if (profile.contactPhone !== null) call(profile.contactPhone);
              }}
            />
            {/* No e-mail field on the warehouse record, so the action has nothing to open. */}
            <ActionButton icon={<MailIcon />} label="Email" onPress={() => undefined} />
            <ActionButton icon={<DirectionsIcon />} label="Directions" onPress={directions} />
          </View>

          <SectionTitle>Emergency Contact</SectionTitle>
          <InfoCard
            rows={[
              [
                { label: 'Name', value: noValue },
                { label: 'Phone', value: noValue },
              ],
            ]}
          />
          <View style={warehouseProfileLayout.gap} />
          <WalletButton label="Call Emergency Contact" variant="outline" onPress={() => undefined} />
        </ScrollView>
      )}
    </WalletScreen>
  );
}

function ActionButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: adminSpacing.sm },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    paddingVertical: adminSpacing.md,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    backgroundColor: adminColors.brandTint,
  },
  actionText: { ...adminType.rowTitle, color: adminColors.brandDeep },
});
