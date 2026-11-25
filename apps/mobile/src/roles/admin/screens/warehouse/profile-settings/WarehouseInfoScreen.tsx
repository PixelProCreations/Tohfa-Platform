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
 * Live (plan phase 8, BR-66): the record is GET /warehouses/{id}, the stock
 * figure GET /warehouses/{id}/capacity (used kg, derived from ACTIVE batches)
 * and the location count the total of GET /warehouses/{id}/storage-locations.
 * A Sub admin reads only its own warehouse (scope.warehouseId; any other id is
 * 404). Read-only for Sub: warehouse.profile.edit is `none` for it, so the
 * header pencil (the design's Edit control, `onEdit`) is drawn only with that
 * code and never for Sub. Main picks a warehouse in the header selector; its
 * options are still the design's sample codes until the Main phase, which the
 * API does not know, so Main sees "not available" here for now.
 *
 * GET /warehouses/{id} has no Region or Assigned Admin; the design's cells for
 * them are still shown, with an em-dash. Not ported: three modal sheets (Operating / Contact / Documents) that
 * nothing could open (only the map sheet was reachable); the sections they
 * duplicated are the sub-screens. The fake bottom tab bar is the shared
 * WarehouseTabBar, shown when the host passes onTabChange.
 */
import React, { useState } from 'react';
import { Alert, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModalSafeArea } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  HeaderIconButton,
  InfoCard,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import { isAreaAvailable } from '../availability';
import { MenuCard, MenuRow } from './ProfileParts';
import type { CapacityView, WarehouseProfileView, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import {
  ClockIcon,
  CloseIcon,
  DocumentIcon,
  LinkCard,
  MapFoldedIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshIcon,
  singleWarehouseId,
  SingleWarehouseHeader,
  StorageRackIcon,
  WarehouseBuildingIcon,
  warehouseProfileLayout,
} from './WarehouseProfileParts';

/** The sub-screens this profile opens (ProfileFlow routes). */
export type WarehouseProfileChildRoute = 'StorageInfo' | 'OperatingInfo' | 'Contact' | 'Documents';

/** Header edit action: the design's pencil (M15-S01), drawn on the brand header. */
function PencilEditIcon() {
  return (
    <Svg width={EDIT_ICON} height={EDIT_ICON} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface WarehouseInfoScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  /** Open a sub-screen. Without it the section list is not shown. */
  onOpen?: ((route: WarehouseProfileChildRoute) => void) | undefined;
  /**
   * Open Edit Warehouse Profile. The header pencil is drawn only with this AND
   * warehouse.profile.edit (BR-80), and only once the warehouse has loaded.
   */
  onEdit?: (() => void) | undefined;
  /** The live warehouse (GET /warehouses/{id}); undefined until it loads. */
  profile?: WarehouseProfileView | undefined;
  /** GET /warehouses/{id}/capacity; undefined while loading or on failure (the field shows no value). */
  capacity?: CapacityView | undefined;
  /** The total of GET /warehouses/{id}/storage-locations; null while unknown. */
  locationCount?: number | null | undefined;
  /** There is no warehouse the API knows to ask for (Main with a sample selection). */
  unavailable?: boolean | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
}

export function WarehouseInfoScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onOpen,
  onEdit,
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
  profile,
  capacity,
  locationCount = null,
  unavailable = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: WarehouseInfoScreenProps) {
  const [showMap, setShowMap] = useState(false);

  const headerWarehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const state = unavailable ? 'unavailable' : profile !== undefined ? 'ready' : queryViewState({ isLoading, error, itemCount: 0 });
  // Fail closed: no code (or no `can` grants) means no control. The server refuses the PATCH anyway.
  const showEdit = state === 'ready' && profile !== undefined && onEdit !== undefined && can('warehouse.profile.edit');
  const noValue = t('profile.noValue');
  const mapTarget = profile?.address ?? profile?.coordinates ?? null;

  const openDirections = () => {
    if (!profile || mapTarget === null) return;
    setShowMap(false);
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(mapTarget)}`).catch(() => {
      Alert.alert(t('profile.warehouse.directionsTitle'), mapTarget);
    });
  };

  return (
    <WalletScreen
      title={
        <View style={styles.headerTitleWrap}>
          <WarehouseBuildingIcon size={20} color={adminColors.onBrand} />
          <Text style={styles.headerTitleText}>Warehouse Profile</Text>
        </View>
      }
      onBack={onBack}
      headerRight={
        onRefresh || showEdit ? (
          <View style={styles.headerActions}>
            {onRefresh ? (
              <HeaderIconButton onPress={onRefresh} accessibilityLabel="Refresh profile">
                <RefreshIcon />
              </HeaderIconButton>
            ) : null}
            {showEdit && onEdit ? (
              <HeaderIconButton onPress={onEdit} accessibilityLabel={t('warehouseEdit.open')}>
                <PencilEditIcon />
              </HeaderIconButton>
            ) : null}
          </View>
        ) : undefined
      }
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
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <WarehouseBuildingIcon size={28} />
            </View>
            <Text style={styles.heroTitle}>{profile.name}</Text>
            <Text style={styles.heroMeta}>Warehouse ID: {profile.code}</Text>
            <View style={styles.heroBadge}>
              <StatusBadge label={profile.statusLabel} tone={profile.isActive ? 'success' : 'danger'} />
            </View>
          </View>

          <SectionTitle>Information</SectionTitle>
          <InfoCard
            rows={[
              [
                { label: 'Warehouse Name', value: profile.name },
                { label: 'Warehouse ID', value: profile.code },
              ],
              [
                { label: 'Status', value: profile.statusLabel },
                { label: 'Warehouse Type', value: profile.kindLabel },
              ],
              [
                { label: t('profile.warehouse.region'), value: noValue },
                { label: t('profile.warehouse.assignedSwa'), value: noValue },
              ],
            ]}
          />

          <SectionTitle>Location</SectionTitle>
          <InfoCard rows={[[{ label: 'Location', value: profile.address ?? noValue }]]} />
          <View style={warehouseProfileLayout.gap} />
          <LinkCard icon={<MapFoldedIcon />} title="Map Preview" actionLabel="Open Map" onPress={() => setShowMap(true)} />

          <SectionTitle>Warehouse Overview</SectionTitle>
          <InfoCard
            rows={[
              [
                { label: 'Storage Locations', value: locationCount === null ? noValue : String(locationCount) },
                { label: 'Active', value: t(profile.isActive ? 'profile.yes' : 'profile.no') },
              ],
              [
                { label: t('profile.warehouse.assignedAdmin'), value: noValue },
                { label: 'Current Stock', value: capacity === undefined ? noValue : formatKg(capacity.usedGrams) },
              ],
            ]}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>{t('profile.warehouse.stockNote')}</Text>
          </View>

          {onOpen ? (
            <>
              <SectionTitle>Warehouse Profile Sections</SectionTitle>
              <MenuCard>
                <MenuRow icon={<StorageRackIcon />} title="Storage Information" onPress={() => onOpen('StorageInfo')} />
                <MenuRow icon={<ClockIcon />} title="Operating Information" onPress={() => onOpen('OperatingInfo')} />
                <MenuRow icon={<PhoneIcon />} title="Warehouse Contact" onPress={() => onOpen('Contact')} />
                {/* Shown only to a role holding the documents permission (BR-105). */}
                {isAreaAvailable('warehouseDocuments', can) ? (
                  <MenuRow icon={<DocumentIcon />} title="Warehouse Documents" onPress={() => onOpen('Documents')} />
                ) : null}
              </MenuCard>
            </>
          ) : null}
        </ScrollView>
      )}

      <Modal visible={showMap && profile !== undefined} animationType="slide" statusBarTranslucent onRequestClose={() => setShowMap(false)}>
        <ModalSafeArea edges={['top']} style={styles.mapRoot}>
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
              {profile?.coordinates ? <Text style={styles.mapCoords}>{profile.coordinates}</Text> : null}
              {profile?.address ? <Text style={styles.mapAddress}>{profile.address}</Text> : null}
            </View>
            <WalletButton label="Start GPS Navigation" onPress={openDirections} />
          </View>
        </ModalSafeArea>
      </Modal>
    </WalletScreen>
  );
}

// Hero and map-sheet icon chip diameters: icon sizes, not spacing.
const HERO_ICON = 56;
const MAP_ICON_CHIP = 40;
const EDIT_ICON = 20;

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  headerTitleText: { ...adminType.title, color: adminColors.onBrand },
  infoBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  infoBoxText: { ...adminType.caption, color: adminColors.info.text },
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
