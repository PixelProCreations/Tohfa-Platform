/**
 * The Inventory tab overview (design M3S01, Main variant): 8 stat cards, then
 * Warehouse Overview, Inventory Health, Recent Stock Movements, Pending Actions
 * and Quick Actions.
 *
 * Shared, not Main-only: the data comes from useMainInventoryOverview (the
 * caller passes its warehouse and permission check) and the header from the
 * caller, so the Sub shell can render the same content for its own warehouse
 * later. Nothing here knows which shell it is in; `onOpen` hands every tap
 * back to the shell's own navigation.
 *
 * What is drawn follows the data rules of the Main dashboard: a figure only
 * once its sources answered (placeholder before), an error with Retry when one
 * failed, a section the caller has no permission for not at all. No delivery
 * or material handling entry is offered (BR-21; dropped 2026-10-14), and no
 * farm identity is shown (BR-16).
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { SectionGate } from '../../dashboard/MainDashboardParts';
import { AdminEmptyState, AdminErrorState } from '../shared/AsyncStates';
import { figureOrPlaceholder } from '../../dashboard/mappers_mainDashboard';
import type { MainInventoryTarget } from './mainInventoryMappers';
import {
  InventoryHealthGrid,
  InventoryInfoNote,
  InventoryListCard,
  InventoryListRow,
  InventoryMovementRow,
  InventoryQuickActionGrid,
  InventoryQuickActionTile,
  InventorySectionHeader,
  InventoryStatCard,
  InventoryStatGrid,
  type HealthCell,
} from './MainInventoryParts';
import type { MainInventoryOverview } from './useMainInventoryOverview';

export interface MainInventoryDashboardProps {
  overview: MainInventoryOverview;
  /** The shell's header band (title and warehouse selector or locked pill); scrolls with the content. */
  header?: React.ReactNode;
  /** A card, row or action was tapped. */
  onOpen: (target: MainInventoryTarget) => void;
  /** A Warehouse Overview row was tapped. */
  onOpenWarehouse?: ((warehouseId: string) => void) | undefined;
  /**
   * Rows the shell adds under Pending Actions from data only it reads (the Main
   * shell's returns awaiting approval, from its task summary). Already worded
   * and gated by the shell.
   */
  extraPendingRows?: readonly ExtraPendingRow[] | undefined;
}

export interface ExtraPendingRow {
  key: string;
  label: string;
  /** The figure, or the placeholder while its source is not ready. */
  value: string;
  onPress: () => void;
}

const NO_EXTRA_ROWS: readonly ExtraPendingRow[] = [];

export function MainInventoryDashboard({
  overview,
  header,
  onOpen,
  onOpenWarehouse,
  extraPendingRows = NO_EXTRA_ROWS,
}: MainInventoryDashboardProps) {
  const { access, cards, cardSources, health, movements, pendingActions, quickActions } = overview;
  const failedCard = cardSources.find((source) => source.status === 'error');

  const healthCells: HealthCell[] = [
    {
      key: 'normal',
      label: t('mainDashboard.inventory.health.normal'),
      value: figureOrPlaceholder(health.source.status, () =>
        t('mainDashboard.inventory.health.products', { count: health.value.normal }),
      ),
      tone: 'success',
    },
    {
      key: 'low',
      label: t('mainDashboard.inventory.health.low'),
      value: figureOrPlaceholder(health.source.status, () => t('mainDashboard.inventory.health.products', { count: health.value.low })),
      tone: 'warning',
    },
    ...(health.verificationPending === null
      ? []
      : [
          {
            key: 'verificationPending',
            label: t('mainDashboard.inventory.health.verificationPending'),
            value: health.verificationPending,
            tone: 'ink' as const,
          },
        ]),
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollPad}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={overview.isRefreshing}
          onRefresh={overview.refresh}
          colors={[adminColors.brand]}
          tintColor={adminColors.brand}
        />
      }
    >
      {header}
      <View style={styles.body}>
        {cards.length > 0 ? (
          <InventoryStatGrid>
            {cards.map((card) => (
              <InventoryStatCard
                key={card.key}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                tone={card.tone}
                onPress={() => onOpen(card.target)}
              />
            ))}
          </InventoryStatGrid>
        ) : (
          <AdminEmptyState title={t('mainDashboard.notAvailable')} />
        )}
        {failedCard !== undefined ? <AdminErrorState error={failedCard.error} onRetry={overview.retry} /> : null}
        {overview.partial ? <Text style={styles.partialNote}>{t('mainDashboard.partial')}</Text> : null}
        {access.lowStock ? <InventoryInfoNote text={t('mainDashboard.inventory.thresholdNote')} /> : null}

        {access.stock ? (
          <>
            <InventorySectionHeader title={t('mainDashboard.inventory.section.overview')} />
            <SectionGate sources={[overview.overview.source]}>
              {overview.overview.rows.length === 0 ? (
                <AdminEmptyState title={t('mainDashboard.inventory.overview.empty')} />
              ) : (
                <InventoryListCard>
                  {overview.overview.rows.map((row, index) => (
                    <InventoryListRow
                      key={row.warehouseId}
                      label={row.name}
                      value={row.stockText}
                      divider={index > 0}
                      onPress={onOpenWarehouse === undefined ? undefined : () => onOpenWarehouse(row.warehouseId)}
                    />
                  ))}
                </InventoryListCard>
              )}
            </SectionGate>
          </>
        ) : null}

        {access.stock && access.lowStock ? (
          <>
            <InventorySectionHeader title={t('mainDashboard.inventory.section.health')} />
            <SectionGate sources={[health.source]}>
              <InventoryHealthGrid cells={healthCells} />
            </SectionGate>
          </>
        ) : null}

        {access.ledger ? (
          <>
            <InventorySectionHeader
              title={t('mainDashboard.inventory.section.movements')}
              actionLabel={t('mainDashboard.view')}
              onAction={() => onOpen('ledger')}
            />
            <SectionGate sources={[movements.source]}>
              {movements.rows.length === 0 ? (
                <AdminEmptyState title={t('mainDashboard.inventory.movements.empty')} />
              ) : (
                movements.rows.map((row) => (
                  <InventoryMovementRow
                    key={row.id}
                    title={row.title}
                    subtitle={row.subtitle}
                    qty={row.qty}
                    time={row.time}
                    direction={row.direction}
                    onPress={() => onOpen('ledger')}
                  />
                ))
              )}
            </SectionGate>
          </>
        ) : null}

        {pendingActions.length + extraPendingRows.length > 0 ? (
          <>
            <InventorySectionHeader title={t('mainDashboard.inventory.section.pending')} />
            <InventoryListCard>
              {pendingActions.map((row, index) => (
                <InventoryListRow
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  divider={index > 0}
                  onPress={() => onOpen(row.target)}
                />
              ))}
              {extraPendingRows.map((row, index) => (
                <InventoryListRow
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  divider={pendingActions.length + index > 0}
                  onPress={row.onPress}
                />
              ))}
            </InventoryListCard>
          </>
        ) : null}

        {quickActions.length > 0 ? (
          <>
            <InventorySectionHeader title={t('mainDashboard.inventory.section.quick')} />
            <InventoryQuickActionGrid>
              {quickActions.map((action) => (
                <InventoryQuickActionTile
                  key={action.key}
                  label={action.label}
                  icon={action.key}
                  onPress={() => onOpen(action.target)}
                />
              ))}
            </InventoryQuickActionGrid>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollPad: {
    paddingBottom: adminSpacing.xl,
  },
  body: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },
  partialNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
});
