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

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
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
import { ACTIVITY_STATUS_TONE, ActivityCategoryIcon } from './WarehouseActivityScreen';
import type { ActivityItem, ActivityModule, WarehouseScreenBaseProps } from './types';

const MODULE_NAME: Record<ActivityModule, string> = {
  receiving: 'Receiving',
  storage: 'Storage Locations',
  verification: 'Stock Verification',
  material_handling: 'Material Handling',
  operational_issue: 'Operational Issues',
  orders: 'Orders',
  cash: 'Cash Top-Up',
  qc: 'Quality Check',
  staff: 'Staff Attendance',
};

export interface ActivityDetailScreenProps extends WarehouseScreenBaseProps {
  activityId?: string | undefined;
  activities?: readonly ActivityItem[] | undefined;
  /** Open the module that owns this record. */
  onOpenModule?: ((module: ActivityModule) => void) | undefined;
}

export function ActivityDetailScreen({ scope, onBack, activityId, activities = ACTIVITIES, onOpenModule }: ActivityDetailScreenProps) {
  const activity = activities.find((a) => a.id === activityId && inScope(scope, a.warehouseId));

  if (activity === undefined) {
    return (
      <WalletScreen title="Activity Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        <EmptyState title="Activity not found" subtitle="This activity is not available in your warehouse." />
      </WalletScreen>
    );
  }

  const warehouse = storageWarehouseName(activity.warehouseId);

  return (
    <WalletScreen
      title="Activity Detail"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={`${warehouse} Warehouse`} />}
      footer={
        onOpenModule ? (
          <WalletFooter>
            <WalletButton label={`Open in ${MODULE_NAME[activity.module]}`} onPress={() => onOpenModule(activity.module)} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <ActivityCategoryIcon category={activity.category} size={20} />
          </View>
          <Text style={styles.title}>{activity.title}</Text>
          <StatusBadge label={activity.status} tone={ACTIVITY_STATUS_TONE[activity.status]} />
        </View>
        <InfoCard
          rows={[
            [
              { label: 'Activity ID', value: activity.id },
              { label: 'Activity Type', value: activity.category },
            ],
            [
              { label: 'Date / Time', value: activity.when },
              { label: 'Warehouse', value: warehouse },
            ],
            [
              { label: 'Performed By', value: activity.performedBy },
              { label: 'Status', value: activity.status },
            ],
          ]}
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
        <SectionTitle>Action</SectionTitle>
        <InfoCard rows={[[{ label: activity.subtitle, value: activity.action }]]} />
        <SectionTitle>Reference</SectionTitle>
        <InfoCard rows={[[{ label: MODULE_NAME[activity.module], value: activity.reference }]]} />
        <SectionTitle>Notes</SectionTitle>
        <InfoCard rows={[[{ label: activity.performedBy, value: activity.notes }]]} />
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
