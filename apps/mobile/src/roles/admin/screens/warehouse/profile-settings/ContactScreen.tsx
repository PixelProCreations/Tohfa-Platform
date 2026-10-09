/**
 * Warehouse Contact for the Main and Sub warehouse admins (FINAL_LIST #87).
 *
 * Was roles/subwarehouse SubWarehouseContactScreen. Gate: none. Read-only for
 * both roles: no edit control and no rbac code or endpoint for warehouse
 * contacts (SPEC_GAPS W4m-1). Sub sees its own warehouse (locked pill); Main
 * picks one of the four in the header selector.
 *
 * Call / Email / Directions open the device dialer, mail app and maps
 * (Linking). The contact person and the emergency contact render only when
 * the warehouse record has them (the design's own rule: never invented).
 * Not ported: the per-row "Copy" buttons. They only flashed a "copied" toast;
 * no clipboard module is installed, so nothing was ever copied (SPEC_GAPS W4m-3).
 */
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  EmptyState,
  InfoCard,
  InfoNote,
  SectionTitle,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import type { WarehouseContactInfo, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { PROFILE_WAREHOUSES, WAREHOUSE_CONTACTS } from './warehouseFixtures';
import {
  DirectionsIcon,
  LinkCard,
  MailIcon,
  MapFoldedIcon,
  PhoneIcon,
  recordFor,
  singleWarehouseId,
  SingleWarehouseHeader,
  warehouseNameOf,
  warehouseProfileLayout,
} from './WarehouseProfileParts';

export interface ContactScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  contacts?: readonly WarehouseContactInfo[] | undefined;
}

function call(phone: string) {
  Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => Alert.alert('Calling', `Dialing ${phone}`));
}

function email(address: string) {
  Linking.openURL(`mailto:${address}`).catch(() => Alert.alert('Email', `Composing email to ${address}`));
}

export function ContactScreen({
  scope,
  onBack,
  onTabChange,
  warehouseOptions = PROFILE_WAREHOUSES,
  selectedWarehouseId,
  onSelectWarehouse,
  contacts = WAREHOUSE_CONTACTS,
}: ContactScreenProps) {
  const warehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const contact = recordFor(contacts, warehouseId);
  const warehouseName = warehouseNameOf(scope, warehouseId, warehouseOptions);

  const directions = () => {
    if (!contact) return;
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`).catch(() =>
      Alert.alert('Maps', `Opening map directions for ${warehouseName}`),
    );
  };

  return (
    <WalletScreen
      title="Warehouse Contact"
      onBack={onBack}
      headerExtra={
        <SingleWarehouseHeader scope={scope} warehouseId={warehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      {contact === undefined ? (
        <EmptyState title="No contact details" subtitle="Nothing is configured for this warehouse yet." />
      ) : (
        <ScrollView contentContainerStyle={warehouseProfileLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <SectionTitle>Primary Contact</SectionTitle>
          <InfoCard rows={[[{ label: 'Phone', value: contact.phone }], [{ label: 'Email', value: contact.email }]]} />

          {contact.contactPerson ? (
            <>
              <SectionTitle>Contact Person</SectionTitle>
              <InfoCard
                rows={[
                  [
                    { label: 'Name', value: contact.contactPerson.name },
                    { label: 'Role', value: contact.contactPerson.role ?? '' },
                  ],
                  [{ label: 'Phone', value: contact.contactPerson.phone }],
                ]}
              />
            </>
          ) : null}

          <SectionTitle>Address</SectionTitle>
          <InfoCard rows={[[{ label: 'Warehouse Address', value: contact.address }]]} />
          <View style={warehouseProfileLayout.gap} />
          <LinkCard icon={<MapFoldedIcon />} title="Map Preview" actionLabel="Open in Maps" onPress={directions} />

          <SectionTitle>Contact Actions</SectionTitle>
          <View style={styles.actions}>
            <ActionButton icon={<PhoneIcon size={16} color={adminColors.brandDeep} />} label="Call" onPress={() => call(contact.phone)} />
            <ActionButton icon={<MailIcon />} label="Email" onPress={() => email(contact.email)} />
            <ActionButton icon={<DirectionsIcon />} label="Directions" onPress={directions} />
          </View>

          {contact.emergency ? (
            <>
              <SectionTitle>Emergency Contact</SectionTitle>
              <InfoCard
                rows={[
                  [
                    { label: 'Name', value: contact.emergency.name },
                    { label: 'Phone', value: contact.emergency.phone },
                  ],
                ]}
              />
              <View style={warehouseProfileLayout.gap} />
              <WalletButton
                label="Call Emergency Contact"
                variant="outline"
                onPress={() => {
                  if (contact.emergency) call(contact.emergency.phone);
                }}
              />
            </>
          ) : null}
          <View style={warehouseProfileLayout.gap} />
          <InfoNote>Contact person and emergency contact are shown only when the warehouse configuration contains them.</InfoNote>
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
