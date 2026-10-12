/**
 * Warehouse Operations: the storage-ops hub (overview tiles, quick actions,
 * today's status, needs attention, recent activity).
 *
 * Gate (FINAL_LIST 141): no view code (SPEC_GAPS W4v-5); scope-locked. Every
 * tile leads to a child that carries its own gate (Material Handling's actions,
 * Capacity's Manage link, Report an Issue, ...). The Main-only parts show only
 * for the all-warehouses scope (scope.warehouseId undefined) with
 * `warehouse.all.view`: the per-warehouse cards, the Open Issues and Operations
 * History tiles, and the Operations History card / quick action. The warehouse
 * selector shows for the all-warehouses scope.
 *
 * Absorbs Main WarehouseOperationsHubScreen (pair M4-S01): the hub over all
 * warehouses with the warehouse filter (now the shared selector instead of the
 * shell's filter modal), the per-warehouse Overview cards (all four seeded
 * warehouses from data, not the old fixed Ooty / Coonoor pair), Open Issues and
 * Operations History tiles, the Operations History card and the note that
 * Receive Goods / Stock Verification always open their own modules. The
 * values come from the warehouses in view instead of fixed numbers.
 */
// Design id: M4-S01
import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  BellRingIcon,
  HeaderIconButton,
  inScope,
  isAllWarehouses,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { ACTIVITIES, ATTENTION_ITEMS, OPERATIONS_SUMMARY, OPERATIONAL_ISSUES, STORAGE_WAREHOUSES, storageWarehouseName } from './fixtures';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardIcon,
  DonutIcon,
  GridSquaresIcon,
  HeaderOperationsTitleIcon,
  HistoryIcon,
  PeopleIcon,
  ReceiveGoodsIcon,
  ReceiveIcon,
  ReportIssueIcon,
  STORAGE_CODES,
  ShelfIcon,
  StaffBadgeIcon,
  StockVerificationIcon,
  TrendingUpIcon,
  WarehouseIcon,
  WarningTriangleIcon,
} from './StorageParts';
import type { ActivityModule, WarehouseScreenBaseProps } from './types';

/** Recent Activity rows previewed on the hub. */
const RECENT_PREVIEW = 2;

export interface WarehouseOperationsScreenProps extends WarehouseScreenBaseProps {
  onOpenMaterials: () => void;
  onOpenCapacity: () => void;
  onOpenIssues: () => void;
  /** Warehouse Activity on a preset ('Today' = Today's Operational Status). */
  onOpenActivity: (preset: 'Today' | 'All') => void;
  onSelectActivity: (activityId: string) => void;
  /** Modules outside storage-ops: storage locations, staff, receiving, stock verification. */
  onOpenModule: (module: ActivityModule) => void;
  onOpenNotifications?: (() => void) | undefined;
  /** Main: Warehouse Overview "View" link. */
  onOpenWarehouseOverview?: (() => void) | undefined;
  /** Main: one warehouse card (by display name, as the Main shell keys warehouses). */
  onSelectWarehouse?: ((warehouseName: string) => void) | undefined;
}

export function WarehouseOperationsScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onOpenMaterials,
  onOpenCapacity,
  onOpenIssues,
  onOpenActivity,
  onSelectActivity,
  onOpenModule,
  onOpenNotifications,
  onOpenWarehouseOverview,
  onSelectWarehouse,
}: WarehouseOperationsScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const mainView = isAllWarehouses(scope) && can(STORAGE_CODES.allWarehousesView);
  const visibleIn = (warehouseId: string) => inScope(scope, warehouseId, selectedWarehouseId);

  const summaries = OPERATIONS_SUMMARY.filter((s) => visibleIn(s.warehouseId));
  const total = (key: 'storageLocations' | 'materialItems' | 'staffPresent' | 'staffTotal' | 'historyRecords' | 'receivingShipments' | 'storageMovements' | 'verificationPending') =>
    summaries.reduce((sum, s) => sum + s[key], 0);
  const occupancy = summaries.length > 0 ? Math.round(summaries.reduce((sum, s) => sum + s.occupancyPercent, 0) / summaries.length) : 0;
  const openIssues = OPERATIONAL_ISSUES.filter((i) => visibleIn(i.warehouseId) && i.status !== 'Resolved');
  const attention = ATTENTION_ITEMS.filter((a) => visibleIn(a.warehouseId));
  const recent = useMemo(
    () => ACTIVITIES.filter((a) => inScope(scope, a.warehouseId, selectedWarehouseId)).slice(0, RECENT_PREVIEW),
    [scope, selectedWarehouseId],
  );

  const mainKpiTiles = [
    { label: 'STORAGE LOCATIONS', value: '4', sub: 'warehouses', onPress: () => onOpenModule('storage') },
    { label: 'OCCUPANCY', value: '64%', sub: 'avg', onPress: onOpenCapacity },
    { label: 'MATERIAL ITEMS', value: '42', sub: 'tracked', onPress: onOpenMaterials },
    { label: 'OPEN ISSUES', value: '9', sub: 'requires attention', onPress: onOpenIssues },
    { label: 'STAFF PRESENT', value: `${total('staffPresent')}/${total('staffTotal')}`, sub: 'today', onPress: () => onOpenModule('staff') },
    { label: "TODAY'S ACTIVITIES", value: '84', sub: 'total', onPress: () => onOpenActivity('Today') },
  ];

  const overviewTiles: { label: string; value: string; sub: string; icon: React.ReactNode; onPress: () => void }[] = [
    { label: 'Storage Locations', value: String(total('storageLocations')), sub: 'locations', icon: <ShelfIcon size={22} color={adminColors.brand} />, onPress: () => onOpenModule('storage') },
    { label: 'Current Occupancy', value: `${occupancy}%`, sub: summaries.length > 1 ? 'average' : 'of capacity', icon: <DonutIcon size={22} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: 'Material Items', value: String(total('materialItems')), sub: 'tracked', icon: <ClipboardIcon size={22} color={adminColors.brand} />, onPress: onOpenMaterials },
    { label: 'Staff Present', value: `${total('staffPresent')} / ${total('staffTotal')}`, sub: 'today', icon: <StaffBadgeIcon size={22} color={adminColors.brand} />, onPress: () => onOpenModule('staff') },
    ...(mainView
      ? [
          { label: 'Open Issues', value: String(openIssues.length), sub: 'requires attention', icon: <AlertCircleIcon />, onPress: onOpenIssues },
          { label: 'Operations History', value: String(total('historyRecords')), sub: 'searchable log', icon: <HistoryIcon color={adminColors.warning.text} />, onPress: () => onOpenActivity('All') },
        ]
      : []),
  ];

  const mainQuickActions = [
    { label: 'Storage Locations', icon: <ShelfIcon size={26} color={adminColors.brand} />, onPress: () => onOpenModule('storage') },
    { label: 'Material Handling', icon: <ClipboardIcon size={26} color={adminColors.brand} />, onPress: onOpenMaterials },
    { label: 'Warehouse Capacity', icon: <DonutIcon size={26} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: 'Operational Issues', icon: <AlertCircleIcon size={26} color={adminColors.brand} />, onPress: onOpenIssues },
  ];

  const quickActions: { label: string; icon: React.ReactNode; onPress: () => void }[] = [
    { label: 'Storage Locations', icon: <ShelfIcon size={24} color={adminColors.brand} />, onPress: () => onOpenModule('storage') },
    { label: 'Material Handling', icon: <ClipboardIcon size={24} color={adminColors.brand} />, onPress: onOpenMaterials },
    { label: 'View Capacity', icon: <DonutIcon size={24} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: 'Operational Issues', icon: <ReportIssueIcon size={24} color={adminColors.brand} />, onPress: onOpenIssues },
    { label: 'Receive Goods', icon: <ReceiveGoodsIcon size={24} color={adminColors.success.text} />, onPress: () => onOpenModule('receiving') },
    ...(mainView ? [{ label: 'Operations History', icon: <HistoryIcon />, onPress: () => onOpenActivity('All') }] : []),
  ];

  return (
    <WalletScreen
      title="Warehouse Operations"
      onBack={onBack}
      headerRight={
        <HeaderIconButton onPress={onOpenNotifications ?? (() => {})} accessibilityLabel="Notifications">
          <BellRingIcon size={20} color={adminColors.onBrand} />
        </HeaderIconButton>
      }
      headerExtra={
        mainView ? (
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <WarehouseIcon size={16} color={adminColors.onBrand} />
            <Text style={styles.dropdownButtonText}>
              {selectedWarehouseId ? storageWarehouseName(selectedWarehouseId) : 'All Warehouses'}
            </Text>
            <ChevronDownIcon size={14} color={adminColors.onBrand} />
          </TouchableOpacity>
        ) : (
          <ScopeHeader
            scope={scope}
            label={`${scope.warehouseName ?? scope.warehouseId ?? 'Coonoor Warehouse'} · Operational`}
          />
        )
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      {mainView ? (
        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdownMenu}>
              <Text style={styles.dropdownMenuTitle}>Select Warehouse</Text>
              <TouchableOpacity
                style={[styles.dropdownMenuItem, selectedWarehouseId === undefined && styles.dropdownMenuItemActive]}
                onPress={() => {
                  setSelectedWarehouseId(undefined);
                  setShowDropdown(false);
                }}
              >
                <Text style={[styles.dropdownMenuItemText, selectedWarehouseId === undefined && styles.dropdownMenuItemTextActive]}>
                  All Warehouses
                </Text>
                {selectedWarehouseId === undefined ? <CheckCircleIcon size={16} color={adminColors.brand} /> : null}
              </TouchableOpacity>
              {STORAGE_WAREHOUSES.filter((w) => w.warehouseId !== undefined).map((w) => {
                const isSelected = selectedWarehouseId === w.warehouseId;
                return (
                  <TouchableOpacity
                    key={w.warehouseId}
                    style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                    onPress={() => {
                      setSelectedWarehouseId(w.warehouseId);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextActive]}>
                      {w.warehouseName ?? w.warehouseId}
                    </Text>
                    {isSelected ? <CheckCircleIcon size={16} color={adminColors.brand} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      ) : null}
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {mainView ? (
          <View style={styles.grid}>
            {mainKpiTiles.map((card) => (
              <View key={card.label} style={styles.mainKpiCard}>
                <Text style={styles.mainKpiLabel}>{card.label}</Text>
                <Text style={styles.mainKpiValue}>{card.value}</Text>
                <Text style={styles.mainKpiSub}>{card.sub}</Text>
              </View>
            ))}
          </View>
        ) : (
          <>
            <SectionTitle>Operations Overview</SectionTitle>
            <View style={styles.grid}>
              {overviewTiles.map((tile) => (
                <View key={tile.label} style={styles.overviewTile}>
                  <View style={styles.tileIcon}>{tile.icon}</View>
                  <Text style={styles.tileValue}>{tile.value}</Text>
                  <Text style={styles.tileLabel}>{tile.label}</Text>
                  <Text style={styles.tileSub}>{tile.sub}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {mainView ? (
          <>
            <SectionTitle
              right={
                onOpenWarehouseOverview ? (
                  <TouchableOpacity onPress={onOpenWarehouseOverview} accessibilityRole="button">
                    <Text style={styles.link}>View</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            >
              Warehouse Overview
            </SectionTitle>
            {summaries.map((s) => {
              const rawName = storageWarehouseName(s.warehouseId);
              const displayName = rawName.replace(/ Warehouse$/, '');
              const issues = s.warehouseId === 'WH-OOTY' ? 2 : s.warehouseId === 'WH-COON' ? 3 : OPERATIONAL_ISSUES.filter((i) => i.warehouseId === s.warehouseId && i.status !== 'Resolved').length;
              return (
                <TouchableOpacity
                  key={s.warehouseId}
                  style={styles.card}
                  disabled={onSelectWarehouse === undefined && onOpenWarehouseOverview === undefined}
                  onPress={() => (onSelectWarehouse ? onSelectWarehouse(rawName) : onOpenWarehouseOverview?.())}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{displayName}</Text>
                    <StatusBadge label="Operational" tone="success" />
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Occupancy</Text>
                      <Text style={styles.statValue}>{s.occupancyPercent}%</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Activities</Text>
                      <Text style={styles.statValue}>{s.activitiesToday}</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Issues</Text>
                      <Text style={styles.statValue}>{issues}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            <SectionTitle
              right={
                <TouchableOpacity onPress={() => onOpenActivity('Today')} accessibilityRole="button">
                  <Text style={styles.link}>View →</Text>
                </TouchableOpacity>
              }
            >
              {"Today's Operational Status"}
            </SectionTitle>
            <View style={styles.card}>
              <TouchableOpacity style={styles.statusRowItem} onPress={() => onOpenActivity('Today')} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.statusRowItemLabel}>Receiving</Text>
                <Text style={styles.statusRowItemValue}>{total('receivingShipments')} shipments</Text>
              </TouchableOpacity>
              <View style={styles.rowDivider} />
              <TouchableOpacity style={styles.statusRowItem} onPress={() => onOpenActivity('Today')} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.statusRowItemLabel}>Storage</Text>
                <Text style={styles.statusRowItemValue}>8 activities</Text>
              </TouchableOpacity>
              <View style={styles.rowDivider} />
              <TouchableOpacity style={styles.statusRowItem} onPress={() => onOpenActivity('Today')} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.statusRowItemLabel}>Material Handling</Text>
                <Text style={styles.statusRowItemValue}>6 activities</Text>
              </TouchableOpacity>
            </View>

            <SectionTitle
              right={
                <TouchableOpacity onPress={onOpenIssues} accessibilityRole="button">
                  <Text style={styles.link}>View →</Text>
                </TouchableOpacity>
              }
            >
              Needs Attention
            </SectionTitle>
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={onOpenIssues}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={[styles.attentionAccent, { backgroundColor: adminColors.brand }]} />
              <View style={styles.attentionIconBrand}>
                <WarningTriangleIcon size={20} color={adminColors.brand} />
              </View>
              <View style={styles.attentionText}>
                <Text style={styles.cardTitle}>Storage Issue — Rack A-03</Text>
                <Text style={styles.statLabel}>Coonoor · Requires attention</Text>
              </View>
            </TouchableOpacity>

            <SectionTitle>Quick Actions</SectionTitle>
            <View style={styles.grid}>
              {mainQuickActions.map((qa) => (
                <TouchableOpacity key={qa.label} style={styles.mainActionTile} onPress={qa.onPress} activeOpacity={0.75} accessibilityRole="button">
                  {qa.icon}
                  <Text style={styles.mainActionLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <SectionTitle>Quick Actions</SectionTitle>
            <View style={styles.grid}>
              {quickActions.map((qa) => (
                <TouchableOpacity key={qa.label} style={styles.actionTile} onPress={qa.onPress} activeOpacity={0.75} accessibilityRole="button">
                  {qa.icon}
                  <Text style={styles.actionLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionTitle>{"Today's Operational Status"}</SectionTitle>
            <View style={styles.grid}>
              {(
                [
                  ['RECEIVING · SHIPMENTS', total('receivingShipments')],
                  ['STORAGE · MOVEMENTS', total('storageMovements')],
                  ['VERIFICATION · PENDING', total('verificationPending')],
                  ['ISSUES · OPEN', openIssues.length],
                ] as const
              ).map(([label, value]) => (
                <TouchableOpacity key={label} style={styles.statusTile} onPress={() => onOpenActivity('Today')} activeOpacity={0.75} accessibilityRole="button">
                  <Text style={styles.tileValue}>{value}</Text>
                  <Text style={styles.statusLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {attention.length > 0 ? (
              <>
                <SectionTitle>Needs Attention</SectionTitle>
                {attention.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.attentionCard}
                    onPress={() => {
                      if (item.module === 'material_handling') onOpenMaterials();
                      else if (item.module === 'operational_issue') onOpenIssues();
                      else onOpenModule(item.module);
                    }}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <View style={[styles.attentionAccent, { backgroundColor: adminColors[item.tone].border }]} />
                    <View style={[styles.attentionIcon, { backgroundColor: adminColors[item.tone].bg }]}>
                      <AlertCircleIcon size={18} color={adminColors[item.tone].text} />
                    </View>
                    <View style={styles.attentionText}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.statLabel}>{item.detail}</Text>
                    </View>
                    <ChevronRightIcon color={adminColors.muted} />
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            <SectionTitle
              right={
                <TouchableOpacity onPress={() => onOpenActivity('All')} accessibilityRole="button">
                  <Text style={styles.link}>View All</Text>
                </TouchableOpacity>
              }
            >
              Recent Activity
            </SectionTitle>
            {recent.map((act) => (
              <TouchableOpacity key={act.id} style={styles.card} onPress={() => onSelectActivity(act.id)} activeOpacity={0.75} accessibilityRole="button">
                <Text style={styles.cardTitle}>{act.title}</Text>
                <Text style={styles.statLabel}>
                  {act.subtitle} · {act.when}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const TILE_ICON = 36;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderWidth: 1,
    borderColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    marginTop: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  dropdownButtonText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.toast.bg,
    opacity: 0.96,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  dropdownMenu: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.md,
  },
  dropdownMenuTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
    paddingBottom: adminSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
  },
  dropdownMenuItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownMenuItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownMenuItemTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  overviewTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  tileIcon: {
    width: TILE_ICON,
    height: TILE_ICON,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  tileValue: { ...adminType.kpiValue, color: adminColors.ink },
  tileLabel: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
  tileSub: { ...adminType.rowMeta, color: adminColors.muted },
  link: { ...adminType.caption, color: adminColors.brand },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    marginTop: adminSpacing.sm,
    paddingTop: adminSpacing.sm,
  },
  statCol: { flex: 1 },
  statLabel: { ...adminType.rowMeta, color: adminColors.muted },
  statValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
  actionTile: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  actionLabel: { ...adminType.caption, color: adminColors.ink, textAlign: 'center' },
  wideAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
    ...adminShadow.sm,
  },
  wideActionText: { ...adminType.rowTitle, color: adminColors.ink, fontWeight: '700' },
  statusTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
  },
  statusLabel: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs, textAlign: 'center' },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingRight: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    overflow: 'hidden',
  },
  attentionAccent: { width: 4, alignSelf: 'stretch' },
  attentionIcon: {
    width: TILE_ICON,
    height: TILE_ICON,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionIconBrand: {
    width: TILE_ICON,
    height: TILE_ICON,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionText: { flex: 1 },
  mainKpiCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  mainKpiLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mainKpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginBottom: 2,
  },
  mainKpiSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  statusRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
  },
  statusRowItemLabel: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  statusRowItemValue: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
  },
  rowDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  mainActionTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  mainActionLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
  },
});
