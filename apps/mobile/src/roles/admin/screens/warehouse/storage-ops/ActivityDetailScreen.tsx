/**
 * Activity Detail: one logged warehouse activity (summary, action, reference).
 *
 * Gate: read-only. Scope-locked: an activity of another warehouse renders "not found"
 * (no existence leak). The warehouse label comes from the activity's warehouse
 * name. "Open in <module>" hands off to the owning module (host / flow).
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
import type { ActivityRow } from './mappers_activity';
import type { ActivityModule, WarehouseScope, WarehouseScreenBaseProps } from './types';

export interface ActivityDetailScreenProps extends WarehouseScreenBaseProps {
  /**
   * A live row from Warehouse Activity. GET /warehouses/{id}/activity has no
   * detail route, so the screen shows the row it was handed.
   */
  activity?: ActivityRow | undefined;
  /** Open the module that owns this record. */
  onOpenModule?: ((module: ActivityModule) => void) | undefined;
}

interface DetailView {
  warehouseId: string;
  title: string;
  status: { label: string; tone: AdminTone } | undefined;
  id: string;
  type: string;
  when: string;
  warehouse: string;
  headerLabel: string;
  headerOption: WarehouseScope | undefined;
  action: { label: string; value: string } | undefined;
  reference: { label: string; value: string };
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
    action: action === null ? undefined : { label: row.title, value: action },
    reference: { label: row.title, value: row.reference },
    module: row.module,
  };
}

export function ActivityDetailScreen({ scope, onBack, activity: row, onOpenModule }: ActivityDetailScreenProps) {
  const found = row !== undefined ? liveView(row) : undefined;
  const activity = found !== undefined && inScope(scope, found.warehouseId) ? found : undefined;

  if (activity === undefined) {
    return (
      <WalletScreen title="Activity Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        <EmptyState title="Activity not found" subtitle="This activity is not available in your warehouse." />
      </WalletScreen>
    );
  }

  const module = activity.module;
  const moduleLabel = module === 'receiving' ? 'Receiving' : module;

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
            <WalletButton label={`Open in ${moduleLabel}`} onPress={() => onOpenModule(module)} />
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
            ...(activity.status ? [[{ label: 'Status', value: activity.status.label }]] : []),
          ]}
        />
        {activity.action ? (
          <>
            <SectionTitle>Action</SectionTitle>
            <InfoCard rows={[[activity.action]]} />
          </>
        ) : null}
        <SectionTitle>Reference</SectionTitle>
        <InfoCard rows={[[activity.reference]]} />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginVertical: adminSpacing.md },
  title: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
});
