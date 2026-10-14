/**
 * Warehouse City Detail: one warehouse's own data (identity, operational KPIs,
 * capacity usage, assigned SWA) for the Main admin.
 *
 * Gate (FINAL_LIST 156): Main-only; needs `warehouse.all.view` (MAIN all, SUB
 * none). The Sub equivalent is profile-settings Warehouse Profile. Settings
 * also needs `warehouse.capacity.set`.
 *
 * Absorbs MainWarehouseDetailScreen (M15-S01, Main side): its Warehouse ID /
 * location / status, the Operational KPIs (current stock, utilization, today's
 * receiving, today's orders), Warehouse Information (address, assigned SWA,
 * staff count) and its View Documents action, which now opens the shared
 * profile-settings Documents screen on this warehouse (via the flow). The
 * warehouse comes from `warehouseId`, not the old 'Ooty' / 'Coonoor' defaults.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  EmptyState,
  InfoCard,
  InfoNote,
  KpiRow,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { adminWarehouseLabel, adminWarehouseName, swaNameOf, WAREHOUSE_ADMIN_ROWS } from './fixtures';
import {
  CapacityBar,
  CapacityIcon,
  DocumentIcon,
  formatAdminKg,
  GearIcon,
  utilizationPercent,
  ViewTile,
  ViewTileGrid,
  WAREHOUSE_ADMIN_CODES,
} from './WarehouseAdminParts';
import type { WarehouseAdminRow, WarehouseScreenBaseProps } from './types';

export interface WarehouseCityDetailScreenProps extends WarehouseScreenBaseProps {
  warehouseId?: string | undefined;
  warehouses?: readonly WarehouseAdminRow[] | undefined;
  onOpenDocuments?: ((warehouseId: string) => void) | undefined;
  onOpenSettings?: ((warehouseId: string) => void) | undefined;
  onOpenCapacity?: (() => void) | undefined;
}

export function WarehouseCityDetailScreen({
  scope,
  can,
  onBack,
  warehouseId,
  warehouses = WAREHOUSE_ADMIN_ROWS,
  onOpenDocuments,
  onOpenSettings,
  onOpenCapacity,
}: WarehouseCityDetailScreenProps) {
  if (!can(WAREHOUSE_ADMIN_CODES.allView)) {
    return (
      <WalletScreen title="Warehouse Detail" onBack={onBack}>
        <EmptyState title="Not available" subtitle="Viewing another warehouse needs warehouse.all.view." />
      </WalletScreen>
    );
  }

  const w = warehouses.find((row) => row.warehouseId === warehouseId);
  if (w === undefined) {
    return (
      <WalletScreen title="Warehouse Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        <EmptyState title="Warehouse not found" subtitle="Pick a warehouse from the overview." />
      </WalletScreen>
    );
  }

  const pct = utilizationPercent(w.stockKg, w.capacityKg);
  const near = w.status === 'Near Capacity';
  const settings = can(WAREHOUSE_ADMIN_CODES.capacitySet) ? onOpenSettings : undefined;

  return (
    <WalletScreen
      title={adminWarehouseLabel(w.warehouseId)}
      subtitle="Warehouse Detail"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={adminWarehouseName(w.warehouseId)} />}
      footer={
        <WalletFooter>
          <WalletButton label="Back to All Warehouses" variant="outline" onPress={onBack} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusRow}>
          <StatusBadge label={w.status} tone={near ? 'warning' : 'success'} />
          <Text style={styles.meta}>{w.kind}</Text>
        </View>
        <InfoCard
          rows={[
            [
              { label: 'Warehouse', value: adminWarehouseName(w.warehouseId) },
              { label: 'Warehouse ID', value: w.code },
            ],
            [
              { label: 'Location', value: w.city },
              { label: 'SWA', value: swaNameOf(w) ?? 'Unassigned' },
            ],
          ]}
        />

        <SectionTitle>Operational KPIs</SectionTitle>
        <KpiRow
          items={[
            { value: formatAdminKg(w.stockKg), label: 'CURRENT STOCK' },
            { value: `${pct}%`, label: 'UTILIZATION', tone: near ? 'warning' : undefined },
          ]}
        />
        <KpiRow
          items={[
            { value: formatAdminKg(w.receiptsTodayKg), label: "TODAY'S RECEIPTS" },
            { value: String(w.pendingOrders), label: 'PENDING ORDERS' },
            { value: String(w.openIssues), label: 'OPEN ISSUES', tone: w.openIssues > 0 ? 'danger' : undefined },
          ]}
        />

        <SectionTitle>Capacity Usage</SectionTitle>
        <View style={styles.card}>
          <CapacityBar percent={pct} warning={near} />
          <Text style={styles.capacityText}>
            {formatAdminKg(w.stockKg)} of {formatAdminKg(w.capacityKg)} · {pct}%
          </Text>
        </View>

        <SectionTitle>Warehouse Information</SectionTitle>
        <InfoCard
          rows={[
            [{ label: 'Address', value: w.address }],
            [
              { label: 'Operating Hours', value: w.operatingHours },
              { label: 'Staff Count', value: String(w.staffCount) },
            ],
          ]}
        />

        {onOpenDocuments || settings || onOpenCapacity ? <SectionTitle>Quick Actions</SectionTitle> : null}
        <ViewTileGrid>
          {onOpenDocuments ? (
            <ViewTile label="View Documents" icon={<DocumentIcon />} onPress={() => onOpenDocuments(w.warehouseId)} />
          ) : null}
          {settings ? <ViewTile label="Settings" icon={<GearIcon />} onPress={() => settings(w.warehouseId)} /> : null}
          {onOpenCapacity ? (
            <ViewTile label="Capacity" icon={<CapacityIcon size={22} color={adminColors.brand} />} onPress={onOpenCapacity} />
          ) : null}
        </ViewTileGrid>

        <InfoNote tone="brandSoft">
          Selecting a warehouse shows that warehouse&apos;s own data; it never carries figures over from the consolidated
          dashboard.
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginVertical: adminSpacing.sm },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  capacityText: { ...adminType.rowTitle, color: adminColors.ink },
});
