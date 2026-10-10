// Design id: M1-S05 (Main side; the Sub single-warehouse dashboard is SubWarehouseOverviewScreen, a different screen)
/**
 * Warehouse Overview: all four warehouses at a glance, plus the warehouse
 * management the Main admin used to reach through three other screens.
 *
 * Gate (FINAL_LIST 157): Main-only. The screen needs `warehouse.all.view`
 * (MAIN all, SUB none); without it a not-available note renders and
 * WarehouseAdminFlow refuses the route. The 'Manage Warehouses' tile (per-
 * warehouse configuration: low-stock trigger, operating hours, staff, SWA and
 * the Settings / View Hub / Capacity actions) and the Manage SWAs tile need
 * `admin.sub_wh_admin.create`; Settings also needs `warehouse.capacity.set`.
 *
 * Absorbs: MainWarehouseAdminScreen (summary counts, Needs Attention, the
 * Manage SWAs / Warehouse List quick actions), MainWarehouseListScreen
 * (search) and ManageWarehousesScreen (filters, per-warehouse management
 * cards). Dropped: 'Add Warehouse' and 'Provision New Warehouse Hub' (BR-23:
 * four fixed warehouses, no create endpoint or code; SPEC_GAPS W4x-1).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  InfoNote,
  KpiRow,
  ScopeHeader,
  SearchBar,
  SectionHint,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { WarningTriangleIcon } from '../storage-ops/StorageParts';
import { adminWarehouseLabel, swaNameOf, WAREHOUSE_ADMIN_ROWS } from './fixtures';
import {
  CapacityBar,
  CapacityIcon,
  EyeIcon,
  formatAdminKg,
  GearIcon,
  ManageUsersIcon,
  RefreshIcon,
  ScaleIcon,
  TrendIcon,
  utilizationPercent,
  ViewTile,
  ViewTileGrid,
  WAREHOUSE_ADMIN_CODES,
} from './WarehouseAdminParts';
import type { WarehouseAdminRow, WarehouseScreenBaseProps } from './types';

type FilterKey = 'All' | 'Active' | 'Near Capacity';
const FILTERS: readonly FilterKey[] = ['All', 'Active', 'Near Capacity'];

export interface WarehouseOverviewScreenProps extends WarehouseScreenBaseProps {
  warehouses?: readonly WarehouseAdminRow[] | undefined;
  onSelectWarehouse?: ((warehouseId: string) => void) | undefined;
  onOpenSettings?: ((warehouseId: string) => void) | undefined;
  onNavigateComparison?: (() => void) | undefined;
  onNavigatePerformance?: (() => void) | undefined;
  onNavigateCapacitySummary?: (() => void) | undefined;
  onManageSubWarehouseAdmins?: (() => void) | undefined;
}

export function WarehouseOverviewScreen({
  scope,
  can,
  onBack,
  warehouses = WAREHOUSE_ADMIN_ROWS,
  onSelectWarehouse,
  onOpenSettings,
  onNavigateComparison,
  onNavigatePerformance,
  onNavigateCapacitySummary,
  onManageSubWarehouseAdmins,
}: WarehouseOverviewScreenProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('All');
  const [managing, setManaging] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return warehouses.filter((w) => {
      const matches =
        q === '' ||
        adminWarehouseLabel(w.warehouseId).toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        w.city.toLowerCase().includes(q);
      return matches && (filter === 'All' || w.status === filter);
    });
  }, [warehouses, query, filter]);

  if (!can(WAREHOUSE_ADMIN_CODES.allView)) {
    return (
      <WalletScreen title="Warehouse Overview" onBack={onBack}>
        <EmptyState title="Not available" subtitle="The all-warehouses overview needs warehouse.all.view." />
      </WalletScreen>
    );
  }

  const canManage = can(WAREHOUSE_ADMIN_CODES.swaCreate);
  const canSettings = can(WAREHOUSE_ADMIN_CODES.capacitySet) && onOpenSettings !== undefined;
  const nearCapacity = warehouses.filter((w) => w.status === 'Near Capacity');
  const unassigned = warehouses.filter((w) => swaNameOf(w) === undefined);
  const manageSwas = canManage ? onManageSubWarehouseAdmins : undefined;

  return (
    <WalletScreen
      title="Warehouse Overview"
      subtitle={`All ${warehouses.length} warehouses at a glance`}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: String(warehouses.length), label: 'TOTAL' },
            { value: String(warehouses.filter((w) => w.status === 'Active').length), label: 'ACTIVE', tone: 'success' },
            { value: String(nearCapacity.length), label: 'NEEDS ATTENTION', tone: 'warning' },
            { value: String(unassigned.length), label: 'NO SWA', tone: 'danger' },
          ]}
        />
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search warehouse name, ID, location" />
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />

        <SectionTitle right={<SectionHint>{managing ? 'Managing' : `${visible.length} shown`}</SectionHint>}>
          Warehouses
        </SectionTitle>
        {visible.length === 0 ? <EmptyState title="No warehouses" subtitle="Nothing matches this search." /> : null}
        {visible.map((w) => {
          const pct = utilizationPercent(w.stockKg, w.capacityKg);
          const near = w.status === 'Near Capacity';
          const card = (
            <>
              <View style={styles.cardTopRow}>
                <View style={styles.flex}>
                  <Text style={styles.whName}>{adminWarehouseLabel(w.warehouseId)}</Text>
                  <Text style={styles.meta}>
                    {w.code} · {w.city} · {w.kind}
                  </Text>
                </View>
                <StatusBadge label={near ? `${pct}% · Near Capacity` : `${pct}% capacity`} tone={near ? 'warning' : 'success'} />
              </View>
              <CapacityBar percent={pct} warning={near} />
              <Text style={styles.capacityText}>
                {formatAdminKg(w.stockKg)} / {formatAdminKg(w.capacityKg)}
              </Text>
              <View style={styles.statsRow}>
                <Stat label="Stock" value={formatAdminKg(w.stockKg)} />
                <Stat label="Receipts" value={formatAdminKg(w.receiptsTodayKg)} />
                <Stat label="Issues" value={String(w.openIssues)} />
              </View>
              {managing ? (
                <>
                  <View style={styles.statsRow}>
                    <Stat label="LOW-STOCK TRIGGER" value={w.lowStockTrigger} />
                    <Stat label="OPERATING HOURS" value={w.operatingHours} />
                  </View>
                  <View style={styles.statsRow}>
                    <Stat label="ASSIGNED STAFF" value={`${w.staffCount} members`} />
                    <Stat label="SWA" value={swaNameOf(w) ?? 'Unassigned'} />
                  </View>
                  <View style={styles.actionsRow}>
                    {canSettings ? (
                      <CardAction
                        label="Settings"
                        primary
                        icon={<GearIcon size={15} color={adminColors.onBrand} />}
                        onPress={() => onOpenSettings?.(w.warehouseId)}
                      />
                    ) : null}
                    {onSelectWarehouse ? (
                      <CardAction label="View Hub" icon={<EyeIcon size={15} />} onPress={() => onSelectWarehouse(w.warehouseId)} />
                    ) : null}
                    {onNavigateCapacitySummary ? (
                      <CardAction label="Capacity" icon={<CapacityIcon size={15} />} onPress={onNavigateCapacitySummary} />
                    ) : null}
                  </View>
                </>
              ) : null}
            </>
          );
          if (managing || onSelectWarehouse === undefined) {
            return (
              <View key={w.warehouseId} style={styles.card}>
                {card}
              </View>
            );
          }
          return (
            <TouchableOpacity
              key={w.warehouseId}
              style={styles.card}
              onPress={() => onSelectWarehouse(w.warehouseId)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${adminWarehouseLabel(w.warehouseId)} warehouse`}
            >
              {card}
            </TouchableOpacity>
          );
        })}

        {nearCapacity.length > 0 || unassigned.length > 0 ? <SectionTitle>Needs Attention</SectionTitle> : null}
        {nearCapacity.map((w) => (
          <InfoNote key={`cap-${w.warehouseId}`} tone="warning" icon={<WarningTriangleIcon color={adminColors.warning.text} />}>
            {adminWarehouseLabel(w.warehouseId)} nearing capacity · {utilizationPercent(w.stockKg, w.capacityKg)}% utilization
          </InfoNote>
        ))}
        {unassigned.map((w) => (
          <InfoNote key={`swa-${w.warehouseId}`} tone="danger">
            {adminWarehouseLabel(w.warehouseId)} has no assigned SWA
            {manageSwas ? ' · Create a Sub Warehouse Admin' : ''}
          </InfoNote>
        ))}

        <SectionTitle>More Views</SectionTitle>
        <ViewTileGrid>
          {onNavigateComparison ? <ViewTile label="Comparison" icon={<ScaleIcon />} onPress={onNavigateComparison} /> : null}
          {onNavigatePerformance ? <ViewTile label="Performance" icon={<TrendIcon />} onPress={onNavigatePerformance} /> : null}
          {onNavigateCapacitySummary ? (
            <ViewTile label="Capacity Summary" icon={<RefreshIcon />} onPress={onNavigateCapacitySummary} />
          ) : null}
          {canManage ? (
            <ViewTile
              label={managing ? 'Done Managing' : 'Manage Warehouses'}
              icon={<GearIcon />}
              onPress={() => setManaging((m) => !m)}
            />
          ) : null}
          {manageSwas ? <ViewTile label="Manage SWAs" icon={<ManageUsersIcon />} onPress={manageSwas} /> : null}
        </ViewTileGrid>
      </ScrollView>
    </WalletScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function CardAction({
  label,
  icon,
  onPress,
  primary = false,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.action, primary && styles.actionPrimary]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      {icon}
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: adminSpacing.sm },
  whName: { ...adminType.sectionHead, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  capacityText: { ...adminType.rowMeta, color: adminColors.muted },
  statsRow: { flexDirection: 'row', gap: adminSpacing.sm },
  stat: { flex: 1 },
  statLabel: { ...adminType.caption, color: adminColors.muted },
  statValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.xs },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  actionPrimary: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  actionText: { ...adminType.caption, color: adminColors.ink },
  actionTextPrimary: { color: adminColors.onBrand },
});
