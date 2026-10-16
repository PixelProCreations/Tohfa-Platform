/**
 * Activity Detail: one warehouse activity event. There is no detail endpoint
 * (BR-104 is a read-only merge of other modules' rows), so this shows the
 * list row the feed already returned, passed in by StorageFlow. Opened
 * without a row (e.g. a stale deep link) it says the event is not available
 * rather than inventing one.
 *
 * An event carries no free text and no names (BR-104 item 5): only its type,
 * reference, status / severity / kg / direction where they apply, and whether
 * the source row recorded an actor. "Open" goes to the record's owner: an
 * issue opens its detail in this flow, a goods receipt the receiving module.
 */
import React from 'react';
import { ScrollView } from 'react-native';

import { t } from '../../../i18n';
import { AdminEmptyState } from '../shared/AsyncStates';
import { InfoCard, SectionTitle, StatusBadge, WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import type { ActivityRow } from './mappers';
import type { StorageWarehouse } from './StorageWarehouse';
import type { WarehouseScreenBaseProps } from './types';

export interface ActivityDetailScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  activity?: ActivityRow | undefined;
  /** Open the record that owns this event (issue detail, receiving). */
  onOpenRecord?: ((row: ActivityRow) => void) | undefined;
}

export function ActivityDetailScreen({ onBack, warehouse, activity, onOpenRecord }: ActivityDetailScreenProps) {
  if (activity === undefined) {
    return (
      <WalletScreen title={t('storageOps.activity.detailTitle')} onBack={onBack} headerExtra={warehouse.header}>
        <AdminEmptyState title={t('storageOps.activity.notFound')} subtitle={t('storageOps.activity.notFoundHint')} />
      </WalletScreen>
    );
  }
  const none = t('storageOps.notAvailable');
  const openLabel =
    activity.module === 'operational_issue'
      ? t('storageOps.activity.openIssue')
      : activity.module === 'receiving'
        ? t('storageOps.activity.openReceiving')
        : undefined;

  return (
    <WalletScreen
      title={t('storageOps.activity.detailTitle')}
      onBack={onBack}
      headerExtra={warehouse.header}
      footer={
        openLabel !== undefined && onOpenRecord !== undefined ? (
          <WalletFooter>
            <WalletButton label={openLabel} onPress={() => onOpenRecord(activity)} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle right={activity.statusLabel !== undefined ? <StatusBadge label={activity.statusLabel} tone={activity.statusTone} /> : undefined}>
          {activity.typeLabel}
        </SectionTitle>
        <InfoCard
          rows={[
            [
              { label: t('storageOps.activity.field.reference'), value: activity.reference },
              { label: t('storageOps.activity.field.when'), value: activity.when },
            ],
            [
              { label: t('storageOps.activity.field.warehouse'), value: warehouse.warehouseName ?? none },
              { label: t('storageOps.activity.field.quantity'), value: activity.quantity ?? none },
            ],
            [
              { label: t('storageOps.activity.field.direction'), value: activity.directionLabel ?? none },
              { label: t('storageOps.activity.field.severity'), value: activity.severityLabel ?? none },
            ],
            [
              {
                label: t('storageOps.activity.field.actor'),
                value: t(activity.hasActor ? 'storageOps.activity.actorRecorded' : 'storageOps.activity.actorNone'),
              },
            ],
          ]}
        />
      </ScrollView>
    </WalletScreen>
  );
}
