// Design id: M15-S01
/**
 * Warehouse Profile for the Main and Sub warehouse admins (FINAL_LIST #89).
 *
 * Was roles/subwarehouse SubWarehouseProfileScreen (named WarehouseInfoScreen
 * here because WarehouseProfileScreen clashes with roles/farmer/screens/
 * profile/*). It drew its four sub-screens itself through an
 * `activeSubScreen` switch; they are ProfileFlow routes now and this screen
 * lists them (`onOpen`).
 *
 * Gate: none. Read-only for both roles: no rbac code covers warehouse master
 * data (SPEC_GAPS W4m-1) and there is no edit control. Sub sees its own
 * warehouse on the locked pill; Main picks one of the four warehouses in the
 * header selector (a profile of "all warehouses" means nothing, so there is no
 * All chip). The old hard-coded "Coonoor Warehouse" now comes from the scope /
 * the warehouse record.
 *
 * Not ported: three modal sheets (Operating / Contact / Documents) that nothing
 * could open (only the map sheet was reachable); the sections they duplicated
 * are the sub-screens. The fake bottom tab bar is the shared WarehouseTabBar,
 * shown when the host passes onTabChange.
 */
import React, { useState } from 'react';
import { Alert, Linking, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  EmptyState,
  HeaderIconButton,
  InfoCard,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import { MenuCard, MenuRow } from './ProfileParts';
import type { WarehouseScreenBaseProps, WarehouseSelectionProps, WarehouseProfileInfo, StorageLocationItem } from './types';
import { PROFILE_WAREHOUSES, STORAGE_LOCATIONS, WAREHOUSE_PROFILES } from './warehouseFixtures';
import {
  ClockIcon,
  CloseIcon,
  DocumentIcon,
  LinkCard,
  MapFoldedIcon,
  MapPinIcon,
  PhoneIcon,
  recordFor,
  RefreshIcon,
  singleWarehouseId,
  SingleWarehouseHeader,
  StorageRackIcon,
  WarehouseBuildingIcon,
  warehouseProfileLayout,
} from './WarehouseProfileParts';

/** The sub-screens this profile opens (ProfileFlow routes). */
export type WarehouseProfileChildRoute = 'StorageInfo' | 'OperatingInfo' | 'Contact' | 'Documents';

export interface WarehouseInfoScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  /** Open a sub-screen. Without it the section list is not shown. */
  onOpen?: ((route: WarehouseProfileChildRoute) => void) | undefined;
  profiles?: readonly WarehouseProfileInfo[] | undefined;
  /** Used for the storage-location count of the overview card. */
  storageLocations?: readonly StorageLocationItem[] | undefined;
}

export function WarehouseInfoScreen({
  scope,
  onBack,
  onTabChange,
  onOpen,
  warehouseOptions = PROFILE_WAREHOUSES,
  selectedWarehouseId,
  onSelectWarehouse,
  profiles = WAREHOUSE_PROFILES,
  storageLocations = STORAGE_LOCATIONS,
}: WarehouseInfoScreenProps) {
  const [showMap, setShowMap] = useState(false);

  const warehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const profile = recordFor(profiles, warehouseId);
  const locationCount = storageLocations.filter((loc) => loc.warehouseId === warehouseId).length;

  const handleRefresh = () => {
    Alert.alert('Profile Refreshed', `${profile?.warehouseName ?? 'Warehouse'} profile data is up to date.`);
  };

  const openDirections = () => {
    if (!profile) return;
    setShowMap(false);
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`).catch(() => {
      Alert.alert('Directions', `Opening GPS navigation to ${profile.warehouseName}...`);
    });
  };

  return (
    <WalletScreen
      title="Warehouse Profile"
      onBack={onBack}
      headerRight={
        <HeaderIconButton onPress={handleRefresh} accessibilityLabel="Refresh profile">
          <RefreshIcon />
        </HeaderIconButton>
      }
      headerExtra={
        <SingleWarehouseHeader scope={scope} warehouseId={warehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      {profile === undefined ? (
        <EmptyState title="No warehouse profile" subtitle="This warehouse has no profile data yet." />
      ) : (
        <ScrollView contentContainerStyle={warehouseProfileLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <WarehouseBuildingIcon size={28} />
            </View>
            <Text style={styles.heroTitle}>{profile.warehouseName}</Text>
            <Text style={styles.heroMeta}>Warehouse ID: {profile.code}</Text>
            <View style={styles.heroBadge}>
              <StatusBadge label={profile.status} tone={profile.status === 'Active' ? 'success' : 'danger'} />
            </View>
          </View>

          <SectionTitle>Information</SectionTitle>
          <InfoCard
            rows={[
              [
                { label: 'Warehouse Name', value: profile.warehouseName },
                { label: 'Warehouse ID', value: profile.code },
              ],
              [
                { label: 'Status', value: profile.status },
                { label: 'Warehouse Type', value: profile.kind },
              ],
              [
                { label: 'Region', value: profile.region },
                { label: 'Assigned Admin', value: profile.assignedAdmin },
              ],
            ]}
          />

          <SectionTitle>Location</SectionTitle>
          <InfoCard rows={[[{ label: 'Location', value: profile.address }]]} />
          <View style={warehouseProfileLayout.gap} />
          <LinkCard icon={<MapFoldedIcon />} title="Map Preview" actionLabel="Open Map" onPress={() => setShowMap(true)} />

          <SectionTitle>Warehouse Overview</SectionTitle>
          <InfoCard
            rows={[
              [
                { label: 'Storage Locations', value: String(locationCount) },
                { label: 'Active', value: profile.status === 'Active' ? 'Yes' : 'No' },
              ],
              [
                { label: 'Assigned Admin', value: profile.assignedAdmin },
                { label: 'Current Stock', value: profile.currentStock },
              ],
            ]}
          />

          {onOpen ? (
            <>
              <SectionTitle>Warehouse Profile Sections</SectionTitle>
              <MenuCard>
                <MenuRow icon={<StorageRackIcon />} title="Storage Information" onPress={() => onOpen('StorageInfo')} />
                <MenuRow icon={<ClockIcon />} title="Operating Information" onPress={() => onOpen('OperatingInfo')} />
                <MenuRow icon={<PhoneIcon />} title="Warehouse Contact" onPress={() => onOpen('Contact')} />
                <MenuRow icon={<DocumentIcon />} title="Warehouse Documents" onPress={() => onOpen('Documents')} />
              </MenuCard>
            </>
          ) : null}
        </ScrollView>
      )}

      <Modal visible={showMap && profile !== undefined} animationType="slide" onRequestClose={() => setShowMap(false)}>
        <SafeAreaView style={styles.mapRoot}>
          <View style={styles.mapHeader}>
            <View style={styles.mapTitleRow}>
              <View style={styles.mapIconChip}>
                <MapPinIcon size={20} />
              </View>
              <Text style={styles.mapTitle}>Warehouse Location</Text>
            </View>
            <TouchableOpacity onPress={() => setShowMap(false)} accessibilityRole="button" accessibilityLabel="Close map">
              <CloseIcon />
            </TouchableOpacity>
          </View>
          <View style={styles.mapBody}>
            <View style={styles.mapPlaceholder}>
              <MapPinIcon size={36} />
              <Text style={styles.mapCoords}>{profile?.coordinates}</Text>
              <Text style={styles.mapAddress}>{profile?.mapAddress}</Text>
            </View>
            <WalletButton label="Start GPS Navigation" onPress={openDirections} />
          </View>
        </SafeAreaView>
      </Modal>
    </WalletScreen>
  );
}

// Hero and map-sheet icon chip diameters: icon sizes, not spacing.
const HERO_ICON = 56;
const MAP_ICON_CHIP = 40;

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    marginTop: adminSpacing.sm,
  },
  heroIcon: {
    width: HERO_ICON,
    height: HERO_ICON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  heroTitle: { ...adminType.title, color: adminColors.onBrand, textAlign: 'center' },
  heroMeta: { ...adminType.rowMeta, color: adminColors.onBrand, marginTop: adminSpacing.xs },
  heroBadge: { marginTop: adminSpacing.md },

  mapRoot: { flex: 1, backgroundColor: adminColors.card },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  mapTitleRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  mapIconChip: {
    width: MAP_ICON_CHIP,
    height: MAP_ICON_CHIP,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTitle: { ...adminType.sectionHead, color: adminColors.ink },
  mapBody: { flex: 1, padding: adminSpacing.lg, gap: adminSpacing.lg },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    padding: adminSpacing.xl,
    gap: adminSpacing.sm,
  },
  mapCoords: { ...adminType.sectionHead, color: adminColors.ink },
  mapAddress: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },
});
