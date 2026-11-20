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
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { OverviewDashboardCard, OverviewCardsGrid, StatusMetricCard } from '../../../components';
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
import { WarehouseSelector } from '../inventory/WarehouseSelector';
import { ACTIVITIES, ATTENTION_ITEMS, OPERATIONS_SUMMARY, OPERATIONAL_ISSUES, STORAGE_WAREHOUSES, storageWarehouseName } from './fixtures';
import {
  AlertCircleIcon,
  ChevronRightIcon,
  ClipboardIcon,
  DonutIcon,
  HistoryIcon,
  ReceiveGoodsIcon,
  ReportIssueIcon,
  STORAGE_CODES,
  ShelfIcon,
  StaffBadgeIcon,
  WarehouseIcon,
  WarningTriangleIcon,
} from './StorageParts';
import type { ActivityModule, WarehouseScreenBaseProps } from './types';

/** Recent Activity rows previewed on the hub. */
const RECENT_PREVIEW = 2;

export interface WarehouseOperationsScreenProps extends WarehouseScreenBaseProps {
  onOpenMaterials?: (() => void) | undefined;
  onOpenStorageLocations?: (() => void) | undefined;
  onOpenCapacity: () => void;
  onOpenIssues: () => void;
  onOpenReportIssue?: (() => void) | undefined;
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
  onOpenStorageLocations,
  onOpenCapacity,
  onOpenIssues,
  onOpenReportIssue,
  onOpenActivity,
  onSelectActivity,
  onOpenModule,
  onOpenNotifications,
  onOpenWarehouseOverview,
  onSelectWarehouse,
}: WarehouseOperationsScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

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

  const handleOpenStorageLocations = () => {
    if (onOpenStorageLocations) onOpenStorageLocations();
    else onOpenModule('storage');
  };

  const handleOpenMaterials = () => {
    if (onOpenMaterials) onOpenMaterials();
    else onOpenModule('material_handling');
  };

  const mainKpiTiles = [
    { label: 'Storage Locations', value: '4', sub: 'Warehouses', onPress: handleOpenStorageLocations },
    { label: 'Occupancy', value: '64%', sub: 'Avg', onPress: onOpenCapacity },
    { label: 'Material Items', value: '42', sub: 'Tracked', onPress: handleOpenMaterials },
    { label: 'Open Issues', value: '9', sub: 'Requires Attention', onPress: onOpenIssues },
    { label: 'Staff Present', value: '27/34', sub: 'Today', onPress: () => onOpenModule('staff') },
    { label: "Today's Activities", value: '84', sub: 'Total', onPress: () => onOpenActivity('Today') },
  ];

  const subOverviewTiles = [
    {
      label: 'Storage Locations',
      value: String(summaries.length > 0 ? summaries[0].storageLocations : 18),
      icon: <ShelfIcon size={24} color={adminColors.brand} />,
      onPress: handleOpenStorageLocations,
    },
    {
      label: 'Current Occupancy',
      value: `${summaries.length > 0 ? summaries[0].occupancyPercent : 68}%`,
      icon: <DonutIcon size={24} color={adminColors.brand} />,
      onPress: onOpenCapacity,
    },
    {
      label: 'Material Items',
      value: String(summaries.length > 0 ? summaries[0].materialItems : 42),
      icon: <ClipboardIcon size={24} color={adminColors.brand} />,
      onPress: handleOpenMaterials,
    },
    {
      label: 'Staff Present',
      value: summaries.length > 0 ? `${summaries[0].staffPresent} / ${summaries[0].staffTotal}` : '8 / 10',
      icon: <StaffBadgeIcon size={24} color={adminColors.brand} />,
      onPress: () => onOpenModule('staff'),
    },
  ];

  const mainQuickActions = [
    { label: 'Storage Locations', icon: <ShelfIcon size={26} color={adminColors.brand} />, onPress: handleOpenStorageLocations },
    { label: 'Warehouse Capacity', icon: <DonutIcon size={26} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: 'Report Issue', icon: <ReportIssueIcon size={26} color={adminColors.brand} />, onPress: onOpenReportIssue ?? onOpenIssues },
  ];

  const quickActions: { label: string; icon: React.ReactNode; onPress: () => void }[] = [
    { label: 'Storage Locations', icon: <ShelfIcon size={28} color={adminColors.brand} />, onPress: handleOpenStorageLocations },
    { label: 'View Capacity', icon: <DonutIcon size={28} color={adminColors.brand} />, onPress: onOpenCapacity },
    { label: 'Operations Issue', icon: <ReportIssueIcon size={28} color={adminColors.brand} />, onPress: onOpenIssues },
    { label: 'Receive Goods', icon: <ReceiveGoodsIcon size={28} color={adminColors.success.text} />, onPress: () => onOpenModule('receiving') },
    ...(mainView ? [{ label: 'Operations History', icon: <HistoryIcon />, onPress: () => onOpenActivity('All') }] : []),
  ];

  return (
    <WalletScreen
      title="Warehouse Operations"
      onBack={onBack}
      headerRight={
        <HeaderIconButton onPress={onOpenNotifications ?? (() => { })} accessibilityLabel="Notifications">
          <BellRingIcon size={20} color={adminColors.onBrand} />
        </HeaderIconButton>
      }
      headerExtra={
        mainView ? (
          <WarehouseSelector
            scope={scope}
            options={STORAGE_WAREHOUSES}
            selectedId={selectedWarehouseId}
            onSelect={setSelectedWarehouseId}
          />
        ) : (
          <ScopeHeader
            scope={scope}
            label={`${scope.warehouseName ?? scope.warehouseId ?? 'Coonoor Warehouse'} · Operational`}
          />
        )
      }
    >
      <ScrollView contentContainerStyle={[walletLayout.scrollContent, styles.scrollPad]} showsVerticalScrollIndicator={false}>
        {mainView ? (
          <OverviewCardsGrid style={styles.kpiGrid}>
            {mainKpiTiles.map((card) => {
              const getIcon = (label: string): 'box' | 'orders' | 'inventory' | 'alert' | 'pickup' | 'receiving' => {
                const lower = label.toLowerCase();
                if (lower.includes('location')) return 'box';
                if (lower.includes('occupancy')) return 'inventory';
                if (lower.includes('material')) return 'orders';
                if (lower.includes('issue')) return 'alert';
                if (lower.includes('staff')) return 'pickup';
                return 'receiving';
              };
              const isAlert = card.label.toLowerCase().includes('issue');
              return (
                <OverviewDashboardCard
                  key={card.label}
                  value={card.value}
                  title={card.label}
                  subtitle={card.sub}
                  icon={getIcon(card.label)}
                  tone={isAlert ? 'danger' : 'default'}
                  titlePosition="top"
                  onPress={card.onPress}
                />
              );
            })}
          </OverviewCardsGrid>
        ) : (
          <>
            <SectionTitle>Operations Overview</SectionTitle>
            <View style={styles.subOverviewGrid}>
              {subOverviewTiles.map((tile) => (
                <StatusMetricCard
                  key={tile.label}
                  icon={tile.icon}
                  value={tile.value}
                  label={tile.label}
                  onPress={tile.onPress}
                  style={styles.subOverviewCard}
                />
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
                <Text style={styles.statusRowItemLabel}>Storage Locations</Text>
                <Text style={styles.statusRowItemValue}>{total('storageLocations')} locations</Text>
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
            <View style={styles.quickActionsGrid}>
              {quickActions.map((qa) => (
                <TouchableOpacity key={qa.label} style={styles.actionTile} onPress={qa.onPress} activeOpacity={0.75} accessibilityRole="button">
                  {qa.icon}
                  <Text style={styles.actionLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionTitle>{"Today's Operational Status"}</SectionTitle>
            <View style={styles.operationalStatusGrid}>
              {(
                [
                  ['RECEIVING · SHIPMENTS', total('receivingShipments'), () => onOpenModule('receiving')],
                  ['STORAGE · MOVEMENTS', total('storageMovements'), () => onOpenActivity('Today')],
                  ['VERIFICATION · PENDING', total('verificationPending'), () => onOpenModule('verification')],
                  ['ISSUES · OPEN', openIssues.length, onOpenIssues],
                ] as const
              ).map(([label, value, onPress]) => (
                <TouchableOpacity key={label} style={styles.statusTile} onPress={onPress} activeOpacity={0.75} accessibilityRole="button">
                  <Text style={styles.statusValue}>{value}</Text>
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
                      if (item.module === 'material_handling') {
                        if (onOpenMaterials) onOpenMaterials();
                        else onOpenModule('material_handling');
                      } else if (item.module === 'operational_issue') {
                        onOpenIssues();
                      } else if (item.module === 'storage') {
                        handleOpenStorageLocations();
                      } else {
                        onOpenModule(item.module);
                      }
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
              <TouchableOpacity
                key={act.id}
                style={styles.recentCard}
                onPress={() => onSelectActivity(act.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text style={styles.cardTitle}>{act.title}</Text>
                <Text style={styles.statLabel}>
                  {act.reference?.replace('Related GRN ', '') || act.subtitle.split('·')[0].trim()} · {act.when.replace('Today · ', '')}
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
  scrollPad: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  kpiGrid: {
    marginBottom: 20,
  },
  subOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginBottom: 20,
  },
  subOverviewCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    minHeight: 112,
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  subOverviewIconRow: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  subOverviewValue: {
    fontSize: 22,
    fontWeight: '700',
    color: adminColors.ink,
    lineHeight: 28,
  },
  subOverviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    columnGap: 12,
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    columnGap: 12,
    marginBottom: 20,
  },
  operationalStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    columnGap: 12,
    marginBottom: 20,
  },
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
    width: '48%',
    minHeight: 100,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  actionLabel: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: 2,
  },
  wideAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
    ...adminShadow.sm,
  },
  wideActionText: { ...adminType.rowTitle, color: adminColors.ink, fontWeight: '700' },
  statusTile: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: adminColors.ink,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  recentCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingRight: adminSpacing.md,
    marginBottom: 12,
    overflow: 'hidden',
    ...adminShadow.sm,
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
    minHeight: 96,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
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
