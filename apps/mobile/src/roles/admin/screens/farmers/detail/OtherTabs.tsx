/**
 * The remaining tabs of the team design.
 *
 *   Subscription  wired: GET .../subscription (farmer.subscription.view_tier_limits).
 *                 Plan = the tier; payment history has no API (dash).
 *   Soil          no API (teammate-owned module): the design card with the
 *                 dash for sample date, the soil types the plots carry, and the
 *                 DESIGN-ONLY View report / Verify / Flag a discrepancy.
 *   Product listing  no API in this module: the two design sections, empty.
 *   Audit         certification from the profile's certification summary
 *                 (BR-108c); the audit fields have no API (dash).
 *   History       no API: the empty state plus the append-only note.
 */
import React from 'react';
import { Text, View } from 'react-native';
import type { LiveFarmerSubscription } from '../../../api/farmerHooks';
import type { FarmerDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { ActionLink } from './FarmLandTab';
import { LockIcon } from './icons';
import { auditRows, noValue, soilTypesLabel, subscriptionRows, type DesignActionKind, type FarmerDetailAccess } from './model';
import { DetailsTable, EmptyCard, SectionTitle, TabQueryGate, TableRowView } from './parts';
import { detailStyles as s } from './styles';

export function SubscriptionTab({ access, live }: { access: FarmerDetailAccess; live: LiveFarmerSubscription }) {
  return (
    <TabQueryGate
      permitted={access.canViewSubscription}
      hasData={live.subscription !== undefined}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
    >
      {live.subscription !== undefined ? (
        <>
          {!live.subscription.hasSubscription ? <Text style={s.note}>{t('farmerDetail.subscription.none')}</Text> : null}
          <DetailsTable rows={subscriptionRows(live.subscription)} />
        </>
      ) : null}
    </TabQueryGate>
  );
}

export function SoilTab({
  farmer,
  access,
  onDesignAction,
}: {
  farmer: FarmerDetailView;
  access: FarmerDetailAccess;
  onDesignAction: (kind: DesignActionKind, record: string) => void;
}) {
  const record = t('farmerDetail.soil.reportTitle');
  return (
    <>
      <View style={s.detailsCard}>
        <View style={s.plotHeaderRow}>
          <Text style={s.plotTitle}>{noValue()}</Text>
        </View>
        <TableRowView row={{ label: t('farmerDetail.soil.sampleDate'), value: noValue() }} last={false} />
        <TableRowView row={{ label: t('farmerDetail.soil.soilType'), value: soilTypesLabel(farmer) }} last />
        {access.canUseRecordDesignActions ? (
          <View style={s.actionLinksRow}>
            <ActionLink label={t('farmerDetail.soil.viewReport')} onPress={() => onDesignAction('preview', record)} />
            <ActionLink label={t('farmerDetail.farm.verify')} onPress={() => onDesignAction('verify', record)} />
            <ActionLink label={t('farmerDetail.farm.flag')} onPress={() => onDesignAction('flag', record)} />
          </View>
        ) : null}
      </View>
      <Text style={s.note}>{t('farmerDetail.soil.note')}</Text>
    </>
  );
}

export function ProductListingTab() {
  return (
    <>
      <SectionTitle>{t('farmerDetail.listing.recent')}</SectionTitle>
      <EmptyCard text={t('farmerDetail.listing.empty')} />
      <SectionTitle spaced>{t('farmerDetail.listing.history')}</SectionTitle>
      <EmptyCard text={t('farmerDetail.listing.empty')} />
    </>
  );
}

export function AuditTab({ farmer }: { farmer: FarmerDetailView }) {
  return <DetailsTable rows={auditRows(farmer)} />;
}

export function HistoryTab() {
  return (
    <View style={s.historyWrap}>
      <EmptyCard text={t('farmerDetail.history.empty')} />
      <View style={s.appendOnlyBox}>
        <LockIcon size={16} />
        <Text style={s.appendOnlyText}>{t('farmerDetail.history.appendOnly')}</Text>
      </View>
    </View>
  );
}
