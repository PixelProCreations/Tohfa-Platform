/**
 * Quick Actions (Main only): shortcuts to frequent workflows of the Main
 * Warehouse Admin. Each tile opens a destination screen in its owning module,
 * which applies its own gate again.
 *
 * Gate (FINAL_LIST 21): route-guarded on `warehouse.all.view` (MAIN all, SUB
 * none); without it a not-available note renders and HomeFlow refuses the
 * route. Each shortcut shows only when its code passes AND the host wired it:
 * Transfer Stock `transfer.inter_warehouse.initiate`, Create SWA
 * `admin.sub_wh_admin.create` (it used to be drawn inert without the code),
 * Warehouse Targets `warehouse.capacity.set`, Warehouse Overview
 * `warehouse.all.view`. Review Receiving, View Inventory, View Reports and
 * Review Escalations carry no code of their own here; their destinations gate.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { EmptyState, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { ViewTile, ViewTileGrid } from '../warehouse-admin/WarehouseAdminParts';
import type { WarehouseScreenBaseProps } from '../finance-expenses/types';
import { HOME_CODES } from './HomeParts';

const ICON_SIZE = 26;

function TransferArrowsIcon() {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={adminColors.brand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardChecklistIcon() {
  const color = adminColors.brand;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M8 12.5l2.5 2.5L16 10" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingLargeIcon() {
  const color = adminColors.brand;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArchiveCrateIcon() {
  const color = adminColors.brand;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="5" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M5 9v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9" stroke={color} strokeWidth="2" />
      <Path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CreateSwaIcon() {
  const color = adminColors.brand;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Line x1="20" y1="8" x2="20" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="23" y1="11" x2="17" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ViewReportsIcon() {
  const color = adminColors.brand;
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlagTargetIcon() {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" stroke={adminColors.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GavelIcon() {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 -960 960 960" fill={adminColors.brand}>
      <Path d="M160-120v-80h480v80H160Zm226-194L160-540l84-86 228 226-86 86Zm254-254L414-796l86-84 226 226-86 86Zm184 408L302-682l56-56 522 522-56 56Z" />
    </Svg>
  );
}

export interface QuickActionsOverviewScreenProps extends WarehouseScreenBaseProps {
  onTransferStock?: (() => void) | undefined;
  onReviewReceiving?: (() => void) | undefined;
  onWarehouseOverview?: (() => void) | undefined;
  onViewInventory?: (() => void) | undefined;
  onCreateSwa?: (() => void) | undefined;
  onViewReports?: (() => void) | undefined;
  onWarehouseTargets?: (() => void) | undefined;
  onReviewEscalations?: (() => void) | undefined;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: (() => void) | undefined;
  /** rbac code the shortcut needs; undefined = the destination gates itself. */
  code?: string | undefined;
}

export function QuickActionsOverviewScreen({
  can,
  onBack,
  onTransferStock,
  onReviewReceiving,
  onWarehouseOverview,
  onViewInventory,
  onCreateSwa,
  onViewReports,
  onWarehouseTargets,
  onReviewEscalations,
}: QuickActionsOverviewScreenProps) {
  if (!can(HOME_CODES.allView)) {
    return (
      <WalletScreen title="Quick Actions" onBack={onBack}>
        <EmptyState title="Not available" subtitle="Quick Actions are part of the multi-warehouse view (warehouse.all.view)." />
      </WalletScreen>
    );
  }

  const actions: readonly QuickAction[] = [
    { id: 'transfer_stock', label: 'Transfer Stock', icon: <TransferArrowsIcon />, onPress: onTransferStock, code: HOME_CODES.transferInitiate },
    { id: 'review_receiving', label: 'Review Receiving', icon: <ClipboardChecklistIcon />, onPress: onReviewReceiving },
    { id: 'warehouse_overview', label: 'Warehouse Overview', icon: <BuildingLargeIcon />, onPress: onWarehouseOverview, code: HOME_CODES.allView },
    { id: 'view_inventory', label: 'View Inventory', icon: <ArchiveCrateIcon />, onPress: onViewInventory },
    { id: 'create_swa', label: 'Create SWA', icon: <CreateSwaIcon />, onPress: onCreateSwa, code: HOME_CODES.swaCreate },
    { id: 'view_reports', label: 'View Reports', icon: <ViewReportsIcon />, onPress: onViewReports },
    { id: 'warehouse_targets', label: 'Warehouse Targets', icon: <FlagTargetIcon />, onPress: onWarehouseTargets, code: HOME_CODES.capacitySet },
    { id: 'review_escalations', label: 'Review Escalations', icon: <GavelIcon />, onPress: onReviewEscalations },
  ];
  const visible = actions.filter((a) => a.onPress !== undefined && (a.code === undefined || can(a.code)));

  return (
    <WalletScreen title="Quick Actions" subtitle="Shortcuts to frequent, permission-appropriate workflows" onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.gridGap} />
        <ViewTileGrid>
          {visible.map((item) => (
            <ViewTile key={item.id} label={item.label} icon={item.icon} onPress={item.onPress ?? onBack} />
          ))}
        </ViewTileGrid>
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            Each shortcut opens a working destination screen in its owning module — Quick Actions never duplicates a full
            operational form.
          </Text>
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  gridGap: { height: adminSpacing.sm },
  infoBanner: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  infoBannerText: { ...adminType.body, color: adminColors.brandDeep },
});
