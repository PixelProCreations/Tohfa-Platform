/**
 * Tohfa Admin "Inventory & Warehouse" overview (design M10-S01: the
 * warehouses view of AdminOperationsOverviewScreen on tofhafarmfin-rbac),
 * wired to real data. The host mounts it and wires the callbacks; this
 * screen only reads.
 *
 * Access: the whole screen needs `warehouse.all.view` (GET /warehouses);
 * without it, or without a `can`, it shows not-available and fetches nothing.
 * Each figure source is gated on its own code (./warehouseOverviewLogic.ts
 * OPS_OVERVIEW_CODES) and shows the dash when not fetched. The design's two quick
 * links (Stock Ledger, Batches & Verify; Inter-Warehouse Transfers) show only when
 * the host passed their callback AND the caller holds the code; ledger/verification
 * carry the filtered warehouse id (undefined for All Warehouses). The design has no
 * Receiving entry, so this screen has none.
 *
 * The warehouse filter narrows the comparison list and the links' warehouse;
 * the KPI cards stay network-wide (GET /admin/inventory/overview is one
 * aggregate over the caller's scope, BR-116).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { useWarehouseOverviewData } from './useWarehouseOverviewData';
import {
  OPS_OVERVIEW_CODES,
  buildWarehouseRows,
  canViewWarehouseOverview,
  filterOptions,
  filterRows,
  kpiFigures,
  quickLinkAccess,
} from './warehouseOverviewLogic';
import {
  OverviewHeader,
  OverviewSearchBar,
  QuickLinksGrid,
  WarehouseComparisonCard,
  WarehouseFilterModal,
  type QuickLink,
} from './WarehouseOverviewParts';
import { styles } from './warehouseOverviewStyles';

export interface WarehouseOverviewScreenProps {
  onBack?: (() => void) | undefined;
  can: Can;
  onOpenStockLedger?: ((warehouseId?: string) => void) | undefined;
  onOpenStockVerification?: ((warehouseId?: string) => void) | undefined;
  onOpenTransfers?: (() => void) | undefined;
  onOpenWarehouse?: ((warehouseId: string) => void) | undefined;
  /** Bell button (gated on notification.own.view by this screen); toast when no callback. */
  onOpenNotifications?: (() => void) | undefined;
}

export function WarehouseOverviewScreen({
  onBack,
  can,
  onOpenStockLedger,
  onOpenStockVerification,
  onOpenTransfers,
  onOpenWarehouse,
  onOpenNotifications,
}: WarehouseOverviewScreenProps) {
  const allowed = canViewWarehouseOverview(can);
  const has = (code: string) => allowed && can(code);
  const data = useWarehouseOverviewData({
    enabled: allowed,
    overview: has(OPS_OVERVIEW_CODES.overview),
    capacity: has(OPS_OVERVIEW_CODES.capacity),
    transfers: has(OPS_OVERVIEW_CODES.transfers),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Android back: close the filter first, then leave the screen.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showFilterModal) {
        setShowFilterModal(false);
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [showFilterModal, onBack]);

  const rows = useMemo(
    () => buildWarehouseRows(allowed ? (data.warehouses.data ?? []) : [], data.overview, data.capacityById, data.openTransfersById),
    [allowed, data.warehouses.data, data.overview, data.capacityById, data.openTransfersById],
  );
  const visibleRows = useMemo(() => filterRows(rows, searchQuery, selectedId), [rows, searchQuery, selectedId]);
  const options = useMemo(() => filterOptions(rows), [rows]);
  const kpis = kpiFigures(data.overview, data.networkInTransit);

  // Bell: visible when the caller holds notification.own.view; toast when no callback is wired.
  const showBell = allowed && can('notification.own.view');
  const bellCallback = showBell
    ? (onOpenNotifications ?? (() => Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'))))
    : undefined;

  const access = quickLinkAccess(allowed ? can : undefined, { onOpenStockLedger, onOpenStockVerification, onOpenTransfers });
  const warehouseId = selectedId ?? undefined;
  const openLedger = access.stockLedger && onOpenStockLedger ? () => onOpenStockLedger(warehouseId) : undefined;
  const openVerification = access.verification && onOpenStockVerification ? () => onOpenStockVerification(warehouseId) : undefined;
  const openTransfers = access.transfers && onOpenTransfers ? () => onOpenTransfers() : undefined;
  const links: QuickLink[] = [];
  if (openLedger) links.push({ id: 'stockLedger', onPress: openLedger });
  if (openTransfers) links.push({ id: 'transfers', onPress: openTransfers });

  const figureFailed =
    data.overview.status === 'failed' ||
    data.networkInTransit.status === 'failed' ||
    Object.values(data.capacityById).some((f) => f.status === 'failed') ||
    Object.values(data.openTransfersById).some((f) => f.status === 'failed');

  const refreshAll = () => {
    data.warehouses.refresh();
    data.refreshFigures();
  };

  let body: React.ReactNode;
  if (!allowed) {
    body = <AdminEmptyState title={t('warehouseOverview.notAvailable.title')} subtitle={t('warehouseOverview.notAvailable.subtitle')} />;
  } else if (data.warehouses.isLoading) {
    body = <AdminLoadingState />;
  } else if (data.warehouses.data === undefined) {
    body = <AdminErrorState error={data.warehouses.error} onRetry={refreshAll} />;
  } else if (rows.length === 0) {
    body = <AdminEmptyState title={t('warehouseOverview.empty.title')} subtitle={t('warehouseOverview.empty.subtitle')} />;
  } else {
    body = (
      <>
        <OverviewSearchBar value={searchQuery} onChange={setSearchQuery} onOpenFilter={() => setShowFilterModal(true)} />

        {figureFailed ? (
          <View style={styles.figuresFailedRow}>
            <Text style={styles.figuresFailedText}>{t('warehouseOverview.figures.failed')}</Text>
            <TouchableOpacity testID="warehouseOverview.figuresRetry" onPress={data.refreshFigures} accessibilityRole="button">
              <Text style={styles.figuresRetryText}>{t('warehouseOverview.figures.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <OverviewCardsGrid style={styles.gridSpacing}>
          <OverviewDashboardCard
            value={kpis.totalAvailable}
            title={t('warehouseOverview.kpi.totalAvailable.title')}
            subtitle={t('warehouseOverview.kpi.totalAvailable.subtitle')}
            icon="inventory"
            onPress={openLedger}
          />
          <OverviewDashboardCard
            value={kpis.batches}
            title={t('warehouseOverview.kpi.batches.title')}
            subtitle={t('warehouseOverview.kpi.batches.subtitle')}
            icon="box"
            onPress={openLedger}
          />
          <OverviewDashboardCard
            value={kpis.lowStock}
            title={t('warehouseOverview.kpi.lowStock.title')}
            subtitle={t('warehouseOverview.kpi.lowStock.subtitle')}
            icon="box"
            tone="danger"
            onPress={openLedger}
          />
          <OverviewDashboardCard
            value={kpis.pendingVerification}
            title={t('warehouseOverview.kpi.pendingVerification.title')}
            subtitle={t('warehouseOverview.kpi.pendingVerification.subtitle')}
            icon="receiving"
            onPress={openVerification}
          />
          <OverviewDashboardCard
            value={kpis.inTransit}
            title={t('warehouseOverview.kpi.inTransit.title')}
            subtitle={t('warehouseOverview.kpi.inTransit.subtitle')}
            icon="truck"
            onPress={openTransfers}
          />
          <OverviewDashboardCard
            value={kpis.discrepancies}
            title={t('warehouseOverview.kpi.discrepancies.title')}
            subtitle={t('warehouseOverview.kpi.discrepancies.subtitle')}
            icon="alert"
            tone="warning"
            onPress={openVerification}
          />
        </OverviewCardsGrid>

        <Text style={styles.sectionTitleBrown}>{t('warehouseOverview.section.comparison')}</Text>
        <View style={styles.whListSection}>
          {visibleRows.length === 0 ? (
            <View style={styles.emptyBox}>
              <AdminEmptyState title={t('warehouseOverview.empty.noMatch')} />
            </View>
          ) : (
            visibleRows.map((row) => (
              <WarehouseComparisonCard
                key={row.id}
                row={row}
                onPress={
                  onOpenWarehouse
                    ? () => onOpenWarehouse(row.id)
                    : () => Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'))
                }
              />
            ))
          )}
        </View>

        {links.length > 0 ? (
          <>
            <Text style={styles.sectionTitleBrown}>{t('warehouseOverview.section.quickLinks')}</Text>
            <QuickLinksGrid links={links} />
          </>
        ) : null}

        <View style={styles.bottomSpacer} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <OverviewHeader onBack={onBack} onOpenNotifications={bellCallback} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          allowed ? <RefreshControl refreshing={false} onRefresh={refreshAll} colors={[adminColors.brand]} tintColor={adminColors.brand} /> : undefined
        }
      >
        {body}
      </ScrollView>
      <WarehouseFilterModal
        visible={allowed && showFilterModal}
        options={options}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setShowFilterModal(false);
        }}
        onClose={() => setShowFilterModal(false)}
      />
    </SafeAreaView>
  );
}
