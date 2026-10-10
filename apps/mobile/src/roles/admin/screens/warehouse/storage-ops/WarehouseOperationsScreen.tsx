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
import {
  BellRingIcon,
  HeaderIconButton,
  InfoNote,
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
  ChevronRightIcon,
  ClipboardIcon,
  HistoryIcon,
  PeopleIcon,
  ReceiveIcon,
  STORAGE_CODES,
  TrendingUpIcon,
  WarehouseIcon,
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

  const overviewTiles: { label: string; value: string; sub: string; icon: React.ReactNode; onPress: () => void }[] = [
    { label: 'Storage Locations', value: String(total('storageLocations')), sub: 'locations', icon: <WarehouseIcon />, onPress: () => onOpenModule('storage') },
    { label: 'Current Occupancy', value: `${occupancy}%`, sub: summaries.length > 1 ? 'average' : 'of capacity', icon: <TrendingUpIcon color={adminColors.warning.text} />, onPress: onOpenCapacity },
    { label: 'Material Items', value: String(total('materialItems')), sub: 'tracked', icon: <ClipboardIcon />, onPress: onOpenMaterials },
    { label: 'Staff Present', value: `${total('staffPresent')} / ${total('staffTotal')}`, sub: 'today', icon: <PeopleIcon color={adminColors.warning.text} />, onPress: () => onOpenModule('staff') },
    ...(mainView
      ? [
          { label: 'Open Issues', value: String(openIssues.length), sub: 'requires attention', icon: <AlertCircleIcon />, onPress: onOpenIssues },
          { label: 'Operations History', value: String(total('historyRecords')), sub: 'searchable log', icon: <HistoryIcon color={adminColors.warning.text} />, onPress: () => onOpenActivity('All') },
        ]
      : []),
  ];

  const quickActions: { label: string; icon: React.ReactNode; onPress: () => void }[] = [
    { label: 'Storage Locations', icon: <WarehouseIcon color={adminColors.brand} />, onPress: () => onOpenModule('storage') },
    { label: 'Material Handling', icon: <ClipboardIcon color={adminColors.brand} />, onPress: onOpenMaterials },
    { label: 'View Capacity', icon: <TrendingUpIcon />, onPress: onOpenCapacity },
    { label: 'Operational Issues', icon: <AlertCircleIcon color={adminColors.brand} />, onPress: onOpenIssues },
    { label: 'Staff Attendance', icon: <PeopleIcon />, onPress: () => onOpenModule('staff') },
    { label: 'Receive Goods', icon: <ReceiveIcon color={adminColors.success.text} />, onPress: () => onOpenModule('receiving') },
    ...(mainView ? [{ label: 'Operations History', icon: <HistoryIcon />, onPress: () => onOpenActivity('All') }] : []),
  ];

  return (
    <WalletScreen
      title="Warehouse Operations"
      onBack={onBack}
      headerRight={
        onOpenNotifications ? (
          <HeaderIconButton onPress={onOpenNotifications} accessibilityLabel="Notifications">
            <BellRingIcon size={20} color={adminColors.onBrand} />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={isAllWarehouses(scope) ? undefined : `${scope.warehouseName ?? scope.warehouseId} · Operational`}
          warehouseOptions={STORAGE_WAREHOUSES}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={mainView ? setSelectedWarehouseId : undefined}
        />
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Operations Overview</SectionTitle>
        <View style={styles.grid}>
          {overviewTiles.map((tile) => (
            <TouchableOpacity key={tile.label} style={styles.overviewTile} onPress={tile.onPress} activeOpacity={0.75} accessibilityRole="button">
              <View style={styles.tileIcon}>{tile.icon}</View>
              <Text style={styles.tileValue}>{tile.value}</Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileSub}>{tile.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
              const name = storageWarehouseName(s.warehouseId);
              const issues = OPERATIONAL_ISSUES.filter((i) => i.warehouseId === s.warehouseId && i.status !== 'Resolved').length;
              return (
                <TouchableOpacity
                  key={s.warehouseId}
                  style={styles.card}
                  disabled={onSelectWarehouse === undefined && onOpenWarehouseOverview === undefined}
                  onPress={() => (onSelectWarehouse ? onSelectWarehouse(name) : onOpenWarehouseOverview?.())}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{name}</Text>
                    <StatusBadge label="Operational" tone="success" />
                  </View>
                  <View style={styles.statsRow}>
                    {(
                      [
                        ['Occupancy', `${s.occupancyPercent}%`],
                        ['Activities', String(s.activitiesToday)],
                        ['Issues', String(issues)],
                      ] as const
                    ).map(([label, value]) => (
                      <View key={label} style={styles.statCol}>
                        <Text style={styles.statLabel}>{label}</Text>
                        <Text style={styles.statValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}

        <SectionTitle>Quick Actions</SectionTitle>
        <View style={styles.grid}>
          {quickActions.map((qa) => (
            <TouchableOpacity key={qa.label} style={styles.actionTile} onPress={qa.onPress} activeOpacity={0.75} accessibilityRole="button">
              {qa.icon}
              <Text style={styles.actionLabel}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.wideAction} onPress={() => onOpenModule('verification')} activeOpacity={0.8} accessibilityRole="button">
          <CheckCircleIcon size={18} />
          <Text style={styles.wideActionText}>Stock Verification</Text>
        </TouchableOpacity>

        <SectionTitle
          right={
            <TouchableOpacity onPress={() => onOpenActivity('Today')} accessibilityRole="button">
              <Text style={styles.link}>View All</Text>
            </TouchableOpacity>
          }
        >
          {"Today's Operational Status"}
        </SectionTitle>
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
                  <Text style={styles.statLabel}>
                    {mainView ? `${storageWarehouseName(item.warehouseId)} · ` : ''}
                    {item.detail}
                  </Text>
                </View>
                <ChevronRightIcon color={adminColors.muted} />
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        {mainView ? (
          <TouchableOpacity style={styles.attentionCard} onPress={() => onOpenActivity('All')} activeOpacity={0.8} accessibilityRole="button">
            <View style={[styles.attentionAccent, { backgroundColor: adminColors.brand }]} />
            <View style={[styles.attentionIcon, { backgroundColor: adminColors.brandTint }]}>
              <HistoryIcon size={18} />
            </View>
            <View style={styles.attentionText}>
              <Text style={styles.cardTitle}>Operations History & Log</Text>
              <Text style={styles.statLabel}>Long-term searchable record · Stock verifications, material receipts & exports</Text>
            </View>
            <Text style={styles.link}>Open</Text>
          </TouchableOpacity>
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
              {mainView ? `${storageWarehouseName(act.warehouseId)} · ` : ''}
              {act.subtitle} · {act.when}
            </Text>
          </TouchableOpacity>
        ))}

        <InfoNote tone="brandSoft">
          Receive Goods and Stock Verification always open the Receiving and Inventory modules; this hub never recreates those
          workflows.
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const TILE_ICON = 36;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
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
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  wideActionText: { ...adminType.rowTitle, color: adminColors.success.text },
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
  attentionText: { flex: 1 },
});
