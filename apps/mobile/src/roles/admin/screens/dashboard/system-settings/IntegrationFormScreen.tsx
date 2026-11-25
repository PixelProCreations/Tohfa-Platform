/**
 * Screens 7 and 9 of the design: Add Integration and Edit Integration.
 *
 * The fields can be filled in, but nothing is saved: there is no
 * integration-keys endpoint, so Save Integration and Regenerate are disabled,
 * and Service Provider is disabled because no provider list exists to offer.
 * The API key is never shown: Edit shows the server's masked key or the dash.
 */
import React, { useState } from 'react';
import { TextInput, Text, TouchableOpacity, View } from 'react-native';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import {
  ChatBubbleIcon,
  EyeOffIcon,
  GlobeIcon,
  KeyIcon,
  LinkChainIcon,
  LockSecurityIcon,
  RegenerateIcon,
  type IntegrationIconKind,
} from './systemSettingsIcons';
import {
  INTEGRATION_USES,
  INTEGRATION_USE_LABEL,
  IntegrationSummaryCard,
  type IntegrationKeyView,
  type IntegrationUse,
} from './IntegrationKeysScreen';
import {
  CheckboxRow,
  DropdownModal,
  DualActions,
  FieldLabel,
  HelpText,
  ScreenShell,
  SectionTitle,
  SelectField,
  SwitchField,
  type DropdownState,
} from './SystemSettingsParts';
import { toggleIn } from './systemSettingsLogic';
import { ssStyles as styles } from './systemSettingsStyles';

const INTEGRATION_TYPES: readonly IntegrationIconKind[] = ['sms', 'email', 'payment', 'gst', 'cloud', 'api'];
const INTEGRATION_TYPE_LABEL: Record<IntegrationIconKind, TranslationKey> = {
  sms: 'saSettings.integration.type.sms',
  email: 'saSettings.integration.type.email',
  payment: 'saSettings.integration.type.payment',
  gst: 'saSettings.integration.type.gst',
  cloud: 'saSettings.integration.type.cloud',
  api: 'saSettings.integration.type.api',
};

export interface IntegrationFormScreenProps {
  mode: 'add' | 'edit';
  /** The integration being edited (edit mode); null when unknown. */
  integration: IntegrationKeyView | null;
  onBack: () => void;
}

function IconInput({
  icon,
  value,
  onChange,
  placeholder,
  secure = false,
  trailing,
  testID,
}: {
  icon?: React.ReactNode;
  value: string;
  onChange: ((v: string) => void) | undefined;
  placeholder?: string | undefined;
  secure?: boolean;
  trailing?: React.ReactNode;
  testID: string;
}) {
  return (
    <View style={styles.inputWithLeadingIcon}>
      {icon}
      <TextInput
        style={styles.textInputInner}
        value={value}
        onChangeText={onChange}
        editable={onChange !== undefined}
        secureTextEntry={secure}
        placeholder={placeholder}
        placeholderTextColor={adminColors.placeholder}
        autoCapitalize="none"
        testID={testID}
      />
      {trailing}
    </View>
  );
}

export function IntegrationFormScreen({ mode, integration, onBack }: IntegrationFormScreenProps) {
  const [name, setName] = useState(integration?.name ?? '');
  const [type, setType] = useState<IntegrationIconKind | null>(mode === 'edit' ? (integration?.icon ?? null) : null);
  const [endpoint, setEndpoint] = useState(integration?.apiEndpoint ?? '');
  const [secret, setSecret] = useState('');
  const [senderId, setSenderId] = useState(integration?.senderId ?? '');
  const [webhook, setWebhook] = useState(integration?.webhookUrl ?? '');
  const [active, setActive] = useState(mode === 'add' ? true : integration?.status === 'connected');
  const [uses, setUses] = useState<readonly IntegrationUse[]>(integration?.allowedUses ?? []);
  const [dropdown, setDropdown] = useState<DropdownState | null>(null);
  const isEdit = mode === 'edit';
  const prefix = isEdit ? 'saSettings.integrationEdit' : 'saSettings.integrationAdd';

  const typeSelect = (
    <SelectField
      value={type === null ? t('saSettings.integrationForm.typePlaceholder') : t(INTEGRATION_TYPE_LABEL[type])}
      placeholder={type === null}
      onPress={() =>
        setDropdown({
          title: t('saSettings.integrationForm.typeTitle'),
          options: INTEGRATION_TYPES.map((k) => ({ value: k, label: t(INTEGRATION_TYPE_LABEL[k]) })),
          selected: type ?? '',
          onSelect: (v) => setType(INTEGRATION_TYPES.find((k) => k === v) ?? null),
        })
      }
      testID={`${prefix}.type`}
    />
  );
  const providerSelect = (
    <SelectField
      value={integration?.provider ?? t('saSettings.integrationForm.providerPlaceholder')}
      placeholder={integration?.provider === undefined || integration.provider === null}
      onPress={undefined}
      testID={`${prefix}.provider`}
    />
  );
  const useChecks = INTEGRATION_USES.map((use) => (
    <CheckboxRow
      key={use}
      label={t(INTEGRATION_USE_LABEL[use])}
      checked={uses.includes(use)}
      onToggle={() => setUses((prev) => toggleIn(prev, use))}
      padded
      testID={`${prefix}.use.${use}`}
    />
  ));
  const actions = (
    <DualActions
      secondary={{ label: t('saSettings.common.cancel'), onPress: onBack }}
      primary={{ label: t('saSettings.integrationForm.save'), onPress: undefined }}
      testID={`${prefix}.actions`}
    />
  );

  return (
    <ScreenShell
      title={t(isEdit ? 'saSettings.integrationForm.editTitle' : 'saSettings.integrationForm.addTitle')}
      onBack={onBack}
      testID={prefix}
      overlay={<DropdownModal state={dropdown} onClose={() => setDropdown(null)} />}
    >
      {isEdit ? (
        <>
          <IntegrationSummaryCard
            item={{
              name: integration?.name ?? ADMIN_NO_VALUE,
              subtitle: integration?.subtitle ?? null,
              icon: integration?.icon ?? 'sms',
              status: integration?.status ?? null,
            }}
            showChevron={false}
            testID={`${prefix}.summary`}
          />
          <View style={[styles.formGroup, styles.fieldLabelGap]}>
            <FieldLabel first>{t('saSettings.integrationForm.serviceName')}</FieldLabel>
            <TextInput style={styles.textInputBox} value={name} onChangeText={setName} testID={`${prefix}.name`} />
            <FieldLabel>{t('saSettings.integrationForm.provider')}</FieldLabel>
            {providerSelect}
            <FieldLabel>{t('saSettings.integrationForm.apiKey')}</FieldLabel>
            <IconInput
              value={integration?.apiKeyMasked ?? ADMIN_NO_VALUE}
              onChange={undefined}
              trailing={<EyeOffIcon />}
              testID={`${prefix}.apiKey`}
            />
            <FieldLabel>{t('saSettings.integrationForm.secret')}</FieldLabel>
            <View style={styles.inputRow}>
              <View style={styles.flex1}>
                <IconInput
                  icon={<KeyIcon />}
                  value={ADMIN_NO_VALUE}
                  onChange={undefined}
                  trailing={<EyeOffIcon />}
                  testID={`${prefix}.secret`}
                />
              </View>
              <TouchableOpacity style={[styles.regenerateBtn, styles.disabled]} disabled testID={`${prefix}.regenerate`}>
                <RegenerateIcon />
                <Text style={styles.regenerateBtnText}>{t('saSettings.integrationForm.regenerate')}</Text>
              </TouchableOpacity>
            </View>
            <HelpText>{t('saSettings.integrationForm.regenerateHelp')}</HelpText>
            <FieldLabel>{t('saSettings.integrationForm.senderId')}</FieldLabel>
            <IconInput icon={<ChatBubbleIcon />} value={senderId} onChange={setSenderId} testID={`${prefix}.senderId`} />
            <FieldLabel>{t('saSettings.integrationForm.endpoint')}</FieldLabel>
            <IconInput icon={<LinkChainIcon />} value={endpoint} onChange={setEndpoint} testID={`${prefix}.endpoint`} />
            <SwitchField label={t('saSettings.integrationForm.active')} value={active} onChange={setActive} testID={`${prefix}.active`} />
            <FieldLabel>{t('saSettings.integrationForm.allowedUses')}</FieldLabel>
            {useChecks}
          </View>
        </>
      ) : (
        <>
          <SectionTitle first>{t('saSettings.integrationForm.section.basic')}</SectionTitle>
          <View style={styles.formGroup}>
            <FieldLabel first>{t('saSettings.integrationForm.serviceName')}</FieldLabel>
            <TextInput
              style={styles.textInputBox}
              value={name}
              onChangeText={setName}
              placeholder={t('saSettings.integrationForm.serviceNamePlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              testID={`${prefix}.name`}
            />
            <FieldLabel>{t('saSettings.integrationForm.type')}</FieldLabel>
            {typeSelect}
            <FieldLabel>{t('saSettings.integrationForm.provider')}</FieldLabel>
            {providerSelect}
          </View>

          <SectionTitle>{t('saSettings.integrationForm.section.config')}</SectionTitle>
          <View style={styles.formGroup}>
            <FieldLabel first>{t('saSettings.integrationForm.endpoint')}</FieldLabel>
            <IconInput
              icon={<GlobeIcon />}
              value={endpoint}
              onChange={setEndpoint}
              placeholder={t('saSettings.integrationForm.endpointPlaceholder')}
              testID={`${prefix}.endpoint`}
            />
            <FieldLabel>{t('saSettings.integrationForm.secret')}</FieldLabel>
            <IconInput
              icon={<KeyIcon />}
              value={secret}
              onChange={setSecret}
              secure
              placeholder={t('saSettings.integrationForm.secretPlaceholder')}
              trailing={<EyeOffIcon />}
              testID={`${prefix}.secret`}
            />
            <FieldLabel>{t('saSettings.integrationForm.senderId')}</FieldLabel>
            <IconInput
              icon={<ChatBubbleIcon />}
              value={senderId}
              onChange={setSenderId}
              placeholder={t('saSettings.integrationForm.senderIdPlaceholder')}
              testID={`${prefix}.senderId`}
            />
            <HelpText>{t('saSettings.integrationForm.senderIdHelp')}</HelpText>
            <FieldLabel>{t('saSettings.integrationForm.webhook')}</FieldLabel>
            <IconInput
              icon={<LinkChainIcon />}
              value={webhook}
              onChange={setWebhook}
              placeholder={t('saSettings.integrationForm.webhookPlaceholder')}
              testID={`${prefix}.webhook`}
            />
          </View>

          <SectionTitle>{t('saSettings.integrationForm.section.settings')}</SectionTitle>
          <View style={styles.formGroup}>
            <SwitchField
              label={t('saSettings.integrationForm.active')}
              subLabel={t('saSettings.integrationForm.activeHint')}
              value={active}
              onChange={setActive}
              bordered={false}
              testID={`${prefix}.active`}
            />
          </View>

          <SectionTitle>{t('saSettings.integrationForm.section.uses')}</SectionTitle>
          <View style={styles.formGroup}>
            {useChecks}
            <View style={styles.roleAccessBox}>
              <LockSecurityIcon />
              <Text style={styles.roleAccessText}>{t('saSettings.integrationForm.roleAccess')}</Text>
            </View>
          </View>
        </>
      )}
      {actions}
    </ScreenShell>
  );
}
