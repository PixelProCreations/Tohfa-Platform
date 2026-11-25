/**
 * Screen 2 of the design: System Configuration (session & security, fees,
 * certificate & compliance, other settings, Reset / Save).
 *
 * There is no endpoint that reads or writes these system_config values, so
 * every field is drawn with the dash and every control is disabled; Reset and
 * Save are disabled. Nothing here is a local default: the design's
 * "30 Minutes", "2.00", "₹ 10.00", "30 Days Before" were sample values.
 */
import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { t } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { CheckboxRow, DualActions, FieldLabel, ScreenShell, SectionTitle, SelectField, SwitchField } from './SystemSettingsParts';
import { ssStyles as styles } from './systemSettingsStyles';

export interface SystemConfigurationScreenProps {
  onBack: () => void;
}

const noop = undefined;

export function SystemConfigurationScreen({ onBack }: SystemConfigurationScreenProps) {
  return (
    <ScreenShell title={t('saSettings.config.title')} onBack={onBack} testID="saSettings.config">
      <SectionTitle first>{t('saSettings.config.section.session')}</SectionTitle>
      <View style={styles.formGroup}>
        <FieldLabel first>{t('saSettings.config.sessionTimeout')}</FieldLabel>
        <SelectField value={ADMIN_NO_VALUE} onPress={noop} testID="saSettings.config.sessionTimeout" />
        <FieldLabel>{t('saSettings.config.maxLoginAttempts')}</FieldLabel>
        <SelectField value={ADMIN_NO_VALUE} onPress={noop} testID="saSettings.config.maxLoginAttempts" />
        <SwitchField
          label={t('saSettings.config.forcePasswordChange')}
          subLabel={t('saSettings.config.forcePasswordChangeHint')}
          value={false}
          onChange={noop}
          testID="saSettings.config.forcePasswordChange"
        />
      </View>

      <SectionTitle>{t('saSettings.config.section.fees')}</SectionTitle>
      <View style={styles.formGroup}>
        <FieldLabel first>{t('saSettings.config.platformFee')}</FieldLabel>
        <View style={[styles.selectInput, styles.disabled]}>
          <TextInput
            style={styles.textInputInner}
            value={ADMIN_NO_VALUE}
            editable={false}
            testID="saSettings.config.platformFee"
          />
          <Text style={styles.suffixText}>{t('saSettings.config.percentSuffix')}</Text>
        </View>
        <FieldLabel>{t('saSettings.config.transactionFee')}</FieldLabel>
        <SelectField value={ADMIN_NO_VALUE} onPress={noop} testID="saSettings.config.transactionFee" />
      </View>

      <SectionTitle>{t('saSettings.config.section.certificate')}</SectionTitle>
      <View style={styles.formGroup}>
        <FieldLabel first>{t('saSettings.config.certWarning')}</FieldLabel>
        <SelectField value={ADMIN_NO_VALUE} onPress={noop} testID="saSettings.config.certWarning" />
        <FieldLabel>{t('saSettings.config.sendReminderTo')}</FieldLabel>
        <View style={styles.checkboxGrid}>
          <CheckboxRow label={t('saSettings.config.remind.superAdmin')} checked={false} onToggle={noop} testID="saSettings.config.remind.superAdmin" />
          <CheckboxRow label={t('saSettings.config.remind.tohfaAdmin')} checked={false} onToggle={noop} testID="saSettings.config.remind.tohfaAdmin" />
        </View>
        <View style={styles.fieldLabelGap}>
          <CheckboxRow
            label={t('saSettings.config.warehouseAdmin')}
            checked={false}
            onToggle={noop}
            testID="saSettings.config.remind.warehouseAdmin"
          />
        </View>
      </View>

      <SectionTitle>{t('saSettings.config.section.other')}</SectionTitle>
      <View style={styles.formGroup}>
        <SwitchField
          label={t('saSettings.config.maintenanceMode')}
          value={false}
          onChange={noop}
          bordered={false}
          testID="saSettings.config.maintenanceMode"
        />
        <SwitchField
          label={t('saSettings.config.allowDataExport')}
          value={false}
          onChange={noop}
          testID="saSettings.config.allowDataExport"
        />
      </View>

      <DualActions
        secondary={{ label: t('saSettings.common.reset'), onPress: noop }}
        primary={{ label: t('saSettings.config.save'), onPress: noop }}
        testID="saSettings.config.actions"
      />
    </ScreenShell>
  );
}
