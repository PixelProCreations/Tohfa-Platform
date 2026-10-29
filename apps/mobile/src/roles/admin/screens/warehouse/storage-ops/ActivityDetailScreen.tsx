/**
 * Activity Detail: one logged warehouse activity (summary, action, reference,
 * notes).
 *
 * Gate (FINAL_LIST 128): none needed; read-only. Scope-locked: an activity of
 * another warehouse renders "not found" (no existence leak). The warehouse
 * label comes from the activity's warehouse id, not the old hard-coded
 * 'Coonoor'. "Open in <module>" hands off to the owning module (host / flow),
 * which carries its own gates.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, type AdminTone } from '../../../theme';
import {
  EmptyState,
  InfoCard,
  inScope,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { ACTIVITIES, storageWarehouseName } from './fixtures';
import type { ActivityRow } from './mappers_activity';
import { ACTIVITY_STATUS_TONE } from './WarehouseActivityScreen';
import type { ActivityItem, ActivityModule, WarehouseScope, WarehouseScreenBaseProps } from './types';

const MODULE_NAME: Record<ActivityModule, string> = {
  receiving: 'Receiving',
  storage: 'Storage Locations',
  verification: 'Stock Verification',
  operational_issue: 'Operational Issues',
  orders: 'Orders',
  cash: 'Cash Top-Up',
  qc: 'Quality Check',
  staff: 'Staff Attendance',
};

export interface ActivityDetailScreenProps extends WarehouseScreenBaseProps {
  /**
   * A live row from Warehouse Activity. GET /warehouses/{id}/activity has no
   * detail route, so the screen shows the row it was handed; it takes
   * precedence over `activityId`.
   */
  activity?: ActivityRow | undefined;
  /** The Operations hub's sample rows (looked up in `activities` by id). */
  activityId?: string | undefined;
  activities?: readonly ActivityItem[] | undefined;
  /** Open the module that owns this record. */
  onOpenModule?: ((module: ActivityModule) => void) | undefined;
}

/**
 * What the layout below draws. A field left undefined is hidden: a live event
 * carries no actor name, free text or verification counts (BR-104 item 5), so
 * Performed By, Notes and the counts are never filled for one, and Action only
 * when the event has kg or a transfer direction. `module` is undefined when the
 * record has no screen to open (every live type but a goods receipt).
 */
interface DetailView {
  warehouseId: string;
  title: string;
  status: { label: string; tone: AdminTone } | undefined;
  id: string;
  type: string;
  when: string;
  warehouse: string;
  headerLabel: string;
  /** Live only: the row's own warehouse for the Main selector (no sample list). */
  headerOption: WarehouseScope | undefined;
  performedBy: string | undefined;
  metrics: ActivityItem['metrics'];
  action: { label: string; value: string } | undefined;
  reference: { label: string; value: string };
  notes: { label: string; value: string } | undefined;
  module: ActivityModule | undefined;
}

function liveView(row: ActivityRow): DetailView {
  const action = row.qtyLabel ?? row.directionLabel;
  return {
    warehouseId: row.warehouseId,
    title: row.title,
    status: row.status ?? undefined,
    id: row.sourceId,
    type: row.title,
    when: row.time,
    warehouse: row.warehouseName,
    headerLabel: row.warehouseFullName,
    headerOption: { warehouseId: row.warehouseId, warehouseName: row.warehouseFullName },
    performedBy: undefined,
    metrics: undefined,
    action: action === null ? undefined : { label: row.title, value: action },
    reference: { label: row.module !== undefined ? MODULE_NAME[row.module] : row.title, value: row.reference },
    notes: undefined,
    module: row.module,
  };
}

function sampleView(item: ActivityItem): DetailView {
  const warehouse = storageWarehouseName(item.warehouseId);
  return {
    warehouseId: item.warehouseId,
    title: item.title,
    status: { label: item.status, tone: ACTIVITY_STATUS_TONE[item.status] ?? 'info' },
    id: item.id,
    type: item.category,
    when: item.when,
    warehouse,
    headerLabel: `${warehouse} Warehouse`,
    headerOption: undefined,
    performedBy: item.performedBy,
    metrics: item.metrics,
    action: { label: item.subtitle, value: item.action },
    reference: { label: MODULE_NAME[item.module], value: item.reference },
    notes: { label: item.performedBy, value: item.notes },
    module: item.module,
  };
}

export function ActivityDetailScreen({ scope, onBack, activity: row, activityId, activities = ACTIVITIES, onOpenModule }: ActivityDetailScreenProps) {
  const sample = row === undefined ? activities.find((a) => a.id === activityId) : undefined;
  const found = row !== undefined ? liveView(row) : sample !== undefined ? sampleView(sample) : undefined;
  const activity = found !== undefined && inScope(scope, found.warehouseId) ? found : undefined;

  if (activity === undefined) {
    return (
      <WalletScreen title="Activity Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        <EmptyState title="Activity not found" subtitle="This activity is not available in your warehouse." />
      </WalletScreen>
    );
  }

  const module = activity.module;

  return (
    <WalletScreen
      title="Activity Detail"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={activity.headerLabel}
          warehouseOptions={activity.headerOption ? [activity.headerOption] : undefined}
          selectedWarehouseId={activity.headerOption?.warehouseId}
        />
      }
      footer={
        onOpenModule && module !== undefined ? (
          <WalletFooter>
            <WalletButton label={`Open in ${MODULE_NAME[module]}`} onPress={() => onOpenModule(module)} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{activity.title}</Text>
          {activity.status ? <StatusBadge label={activity.status.label} tone={activity.status.tone} /> : null}
        </View>
        <InfoCard
          rows={[
            [
              { label: 'Activity ID', value: activity.id },
              { label: 'Activity Type', value: activity.type },
            ],
            [
              { label: 'Date / Time', value: activity.when },
              { label: 'Warehouse', value: activity.warehouse },
            ],
            [
              ...(activity.performedBy !== undefined ? [{ label: 'Performed By', value: activity.performedBy }] : []),
              ...(activity.status ? [{ label: 'Status', value: activity.status.label }] : []),
            ],
          ].filter((cells) => cells.length > 0)}
        />
        {activity.metrics ? (
          <>
            <SectionTitle>Verification Counts</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'System', value: activity.metrics.system },
                  { label: 'Counted', value: activity.metrics.counted },
                  { label: 'Variance', value: activity.metrics.variance },
                ],
              ]}
            />
          </>
        ) : null}
        {activity.action ? (
          <>
            <SectionTitle>Action</SectionTitle>
            <InfoCard rows={[[activity.action]]} />
          </>
        ) : null}
        <SectionTitle>Reference</SectionTitle>
        <InfoCard rows={[[activity.reference]]} />
        {activity.notes ? (
          <>
            <SectionTitle>Notes</SectionTitle>
            <InfoCard rows={[[activity.notes]]} />
          </>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const ICON_BOX = 32;

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginVertical: adminSpacing.md },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
});
