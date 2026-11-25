/**
 * Screen 8 of the design: one integration's detail (details card,
 * configuration with maintenance switch and allowed uses, Test Connection /
 * Edit Integration, and the "Testing Connection..." progress card).
 *
 * No endpoint backs it: every value the integration does not carry is the
 * dash, the switch and checkboxes are read-only, and Test Connection runs only
 * when the host passes `onTestConnection` (there is no test route). The
 * progress bar has no fill: there is no progress figure to draw.
 */
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { DoneCircleIcon, PencilIcon, SignalWifiIcon, SpinnerRingIcon } from './systemSettingsIcons';
import { INTEGRATION_USE_LABEL, type IntegrationKeyView, type IntegrationUse } from './IntegrationKeysScreen';
import { CheckboxRow, DetailRow, HeaderAction, ScreenShell, SectionTitle, SwitchField } from './SystemSettingsParts';
import { ssStyles as styles } from './systemSettingsStyles';

/** The three uses the design's detail card lists. */
const DETAIL_USES: readonly IntegrationUse[] = ['otp', 'alerts', 'marketing'];

export interface IntegrationDetailViewProps {
  integration: IntegrationKeyView | null;
  onBack: () => void;
  onEdit: () => void;
  onCopyText?: ((text: string) => void) | undefined;
  onTestConnection?: ((integrationId: string) => void) | undefined;
}

export function IntegrationDetailView({ integration, onBack, onEdit, onCopyText, onTestConnection }: IntegrationDetailViewProps) {
  const [testing, setTesting] = useState(false);
  const value = (v: string | null | undefined) => (v === null || v === undefined || v.length === 0 ? ADMIN_NO_VALUE : v);
  const copy = (v: string | null | undefined) =>
    onCopyText === undefined || v === null || v === undefined || v.length === 0 ? undefined : () => onCopyText(v);
  const test =
    onTestConnection === undefined || integration === null
      ? undefined
      : () => {
          setTesting(true);
          onTestConnection(integration.id);
        };

  return (
    <ScreenShell
      title={integration?.name ?? ADMIN_NO_VALUE}
      onBack={onBack}
      testID="saSettings.integrationDetail"
      action={
        <HeaderAction onPress={onEdit} label={t('saSettings.integrationDetail.edit')} testID="saSettings.integrationDetail.headerEdit">
          <PencilIcon />
        </HeaderAction>
      }
    >
      <SectionTitle first>{t('saSettings.integrationDetail.section.details')}</SectionTitle>
      <View style={styles.detailCard}>
        <DetailRow
          label={t('saSettings.integrationDetail.provider')}
          value={value(integration?.provider)}
          strong
          testID="saSettings.integrationDetail.provider"
        />
        <DetailRow
          label={t('saSettings.integrationDetail.key')}
          value={value(integration?.apiKeyMasked)}
          onCopy={{ run: copy(integration?.apiKeyMasked) }}
          testID="saSettings.integrationDetail.key"
        />
        <DetailRow
          label={t('saSettings.integrationDetail.senderId')}
          value={value(integration?.senderId)}
          strong
          onCopy={{ run: copy(integration?.senderId) }}
          testID="saSettings.integrationDetail.senderId"
        />
        <DetailRow
          label={t('saSettings.integrationDetail.endpoint')}
          value={value(integration?.apiEndpoint)}
          onCopy={{ run: copy(integration?.apiEndpoint) }}
          testID="saSettings.integrationDetail.endpoint"
        />
        <DetailRow
          label={t('saSettings.integrationDetail.createdOn')}
          value={value(integration?.createdOn)}
          testID="saSettings.integrationDetail.createdOn"
        />
        <DetailRow
          label={t('saSettings.integrationDetail.lastUsed')}
          value={value(integration?.lastUsed)}
          last
          testID="saSettings.integrationDetail.lastUsed"
        />
      </View>

      <SectionTitle>{t('saSettings.integrationDetail.section.config')}</SectionTitle>
      <View style={styles.formGroup}>
        <SwitchField
          label={t('saSettings.config.maintenanceMode')}
          value={integration?.maintenanceMode ?? false}
          onChange={undefined}
          bordered={false}
          testID="saSettings.integrationDetail.maintenance"
        />
        <View style={styles.divider} />
        <Text style={styles.allowedUsesLabel}>{t('saSettings.integrationDetail.allowedUses')}</Text>
        {DETAIL_USES.map((use) => (
          <CheckboxRow
            key={use}
            label={t(INTEGRATION_USE_LABEL[use])}
            checked={integration?.allowedUses.includes(use) ?? false}
            onToggle={undefined}
            padded
            testID={`saSettings.integrationDetail.use.${use}`}
          />
        ))}
      </View>

      {testing ? (
        <View style={styles.testingCard} testID="saSettings.integrationDetail.testing">
          <View style={styles.testingHead}>
            <SpinnerRingIcon />
            <Text style={styles.testingTitle}>{t('saSettings.integrationDetail.testingTitle')}</Text>
          </View>
          <Text style={styles.testingSubtitle}>{t('saSettings.integrationDetail.testingSubtitle')}</Text>
          <View style={styles.progressBarTrack} />
        </View>
      ) : null}

      {testing ? (
        <TouchableOpacity
          style={[styles.saveButton, styles.saveButtonSolo]}
          activeOpacity={0.8}
          onPress={() => setTesting(false)}
          testID="saSettings.integrationDetail.done"
        >
          <View style={styles.buttonInner}>
            <DoneCircleIcon />
            <Text style={styles.saveButtonText}>{t('saSettings.integrationDetail.done')}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[styles.testConnectionOutlineBtn, test === undefined && styles.disabled]}
            activeOpacity={0.8}
            onPress={test}
            disabled={test === undefined}
            testID="saSettings.integrationDetail.test"
          >
            <SignalWifiIcon />
            <Text style={styles.testConnectionOutlineBtnText} numberOfLines={1}>
              {t('saSettings.integrationDetail.test')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editIntegrationBtn}
            activeOpacity={0.8}
            onPress={onEdit}
            testID="saSettings.integrationDetail.edit"
          >
            <Text style={styles.editIntegrationBtnText}>{t('saSettings.integrationDetail.edit')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenShell>
  );
}
