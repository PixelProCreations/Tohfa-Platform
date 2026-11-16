/**
 * Screen 6 of the design: Integration Keys list (section title, one card per
 * connected service with a Connected / Not Connected pill, + in the header).
 *
 * There is no integration-keys endpoint (system.integration_key.manage exists
 * in docs/rbac.json, no route in docs/openapi.yaml), so the host passes no
 * items and the list shows the empty state inside the design's chrome. The
 * card renders as soon as the host has real items to pass.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t, type TranslationKey } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { ChevronRightIcon, IntegrationTypeIcon, PlusCircleWhiteIcon, type IntegrationIconKind } from './systemSettingsIcons';
import { HeaderAction, ScreenShell, SectionTitle } from './SystemSettingsParts';
import { ssStyles as styles } from './systemSettingsStyles';

export type IntegrationStatus = 'connected' | 'not_connected';

export type IntegrationUse = 'otp' | 'alerts' | 'marketing' | 'payments' | 'dataSync';
export const INTEGRATION_USES: readonly IntegrationUse[] = ['otp', 'alerts', 'marketing', 'payments', 'dataSync'];
export const INTEGRATION_USE_LABEL: Record<IntegrationUse, TranslationKey> = {
  otp: 'saSettings.integration.use.otp',
  alerts: 'saSettings.integration.use.alerts',
  marketing: 'saSettings.integration.use.marketing',
  payments: 'saSettings.integration.use.payments',
  dataSync: 'saSettings.integration.use.dataSync',
};

/** The shape a future integration-keys endpoint has to fill; every field may be unknown. */
export interface IntegrationKeyView {
  id: string;
  name: string;
  subtitle: string | null;
  icon: IntegrationIconKind;
  status: IntegrationStatus | null;
  provider: string | null;
  /** Already masked by the server; the app never holds a secret. */
  apiKeyMasked: string | null;
  senderId: string | null;
  apiEndpoint: string | null;
  webhookUrl: string | null;
  createdOn: string | null;
  lastUsed: string | null;
  allowedUses: readonly IntegrationUse[];
  maintenanceMode: boolean | null;
}

export function StatusPill({ status }: { status: IntegrationStatus | null }) {
  const pill =
    status === 'connected'
      ? [styles.statusPillConnected, styles.statusTextConnected, t('saSettings.integration.status.connected')] as const
      : status === 'not_connected'
        ? [styles.statusPillDisconnected, styles.statusTextDisconnected, t('saSettings.integration.status.notConnected')] as const
        : [styles.statusPillUnknown, styles.statusTextUnknown, ADMIN_NO_VALUE] as const;
  return (
    <View style={[styles.statusPill, pill[0]]}>
      <Text style={[styles.statusPillText, pill[1]]}>{pill[2]}</Text>
    </View>
  );
}

export function IntegrationSummaryCard({
  item,
  onPress,
  showChevron,
  testID,
}: {
  item: Pick<IntegrationKeyView, 'name' | 'subtitle' | 'icon' | 'status'>;
  onPress?: (() => void) | undefined;
  showChevron: boolean;
  testID: string;
}) {
  const body = (
    <>
      <View style={styles.integrationIconBox}>
        <IntegrationTypeIcon kind={item.icon} />
      </View>
      <View style={styles.integrationTextBox}>
        <Text style={styles.integrationCardTitle}>{item.name}</Text>
        <Text style={styles.integrationCardSubtitle}>{item.subtitle ?? ADMIN_NO_VALUE}</Text>
      </View>
      <StatusPill status={item.status} />
      {showChevron ? <ChevronRightIcon /> : null}
    </>
  );
  if (onPress === undefined)
    return (
      <View style={styles.integrationCard} testID={testID}>
        {body}
      </View>
    );
  return (
    <TouchableOpacity style={styles.integrationCard} activeOpacity={0.8} onPress={onPress} testID={testID}>
      {body}
    </TouchableOpacity>
  );
}

export interface IntegrationKeysScreenProps {
  items: readonly IntegrationKeyView[];
  onBack: () => void;
  onAdd: () => void;
  onOpen: (item: IntegrationKeyView) => void;
}

export function IntegrationKeysScreen({ items, onBack, onAdd, onOpen }: IntegrationKeysScreenProps) {
  return (
    <ScreenShell
      title={t('saSettings.integrations.title')}
      onBack={onBack}
      testID="saSettings.integrations"
      action={
        <HeaderAction onPress={onAdd} label={t('saSettings.integrationForm.addTitle')} testID="saSettings.integrations.add">
          <PlusCircleWhiteIcon />
        </HeaderAction>
      }
    >
      <SectionTitle first>{t('saSettings.integrations.title')}</SectionTitle>
      {items.length === 0 ? (
        <AdminEmptyState title={t('saSettings.integrations.emptyTitle')} subtitle={t('saSettings.integrations.emptySubtitle')} />
      ) : null}
      {items.map((item) => (
        <IntegrationSummaryCard
          key={item.id}
          item={item}
          onPress={() => onOpen(item)}
          showChevron
          testID={`saSettings.integrations.row.${item.id}`}
        />
      ))}
    </ScreenShell>
  );
}
