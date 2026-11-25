/**
 * Screen 10 of the design: Emergency Database Export (warning box, reason and
 * details, export options, Export Database).
 *
 * system.db_export.raw exists in docs/rbac.json but no route does, so Export
 * Database calls the host's `onExport` and is disabled without it. The form
 * itself works: reason, details (250 characters, as the design) and options.
 */
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors } from '../../../theme';
import { WarningTriangleIcon } from './systemSettingsIcons';
import { toggleIn } from './systemSettingsLogic';
import {
  CheckboxRow,
  DropdownModal,
  FieldLabel,
  ScreenShell,
  SectionTitle,
  SelectField,
  type DropdownState,
} from './SystemSettingsParts';
import { ssStyles as styles } from './systemSettingsStyles';

export type EmergencyExportReason = 'audit' | 'migration' | 'recovery' | 'securityReview';
export type EmergencyExportOption = 'full' | 'dataOnly' | 'includeLogs' | 'compress';

const REASONS: readonly EmergencyExportReason[] = ['audit', 'migration', 'recovery', 'securityReview'];
const REASON_LABEL: Record<EmergencyExportReason, TranslationKey> = {
  audit: 'saSettings.export.reason.audit',
  migration: 'saSettings.export.reason.migration',
  recovery: 'saSettings.export.reason.recovery',
  securityReview: 'saSettings.export.reason.securityReview',
};
const OPTIONS: readonly EmergencyExportOption[] = ['full', 'dataOnly', 'includeLogs', 'compress'];
const OPTION_LABEL: Record<EmergencyExportOption, TranslationKey> = {
  full: 'saSettings.export.option.full',
  dataOnly: 'saSettings.export.option.dataOnly',
  includeLogs: 'saSettings.export.option.includeLogs',
  compress: 'saSettings.export.option.compress',
};

/** Input length cap the design draws ("0 / 250"); a form limit, not a business threshold. */
export const EXPORT_DETAILS_MAX = 250;

export interface EmergencyExportRequest {
  reason: EmergencyExportReason;
  details: string;
  options: readonly EmergencyExportOption[];
}

export interface EmergencyExportScreenProps {
  onBack: () => void;
  onExport?: ((request: EmergencyExportRequest) => void) | undefined;
}

export function EmergencyExportScreen({ onBack, onExport }: EmergencyExportScreenProps) {
  const [reason, setReason] = useState<EmergencyExportReason | null>(null);
  const [details, setDetails] = useState('');
  const [options, setOptions] = useState<readonly EmergencyExportOption[]>(['full']);
  const [dropdown, setDropdown] = useState<DropdownState | null>(null);

  const submit =
    onExport === undefined
      ? undefined
      : () => {
          if (reason === null) {
            Alert.alert(t('saSettings.export.requiredTitle'), t('saSettings.export.requiredBody'));
            return;
          }
          Alert.alert(
            t('saSettings.export.confirmTitle'),
            t('saSettings.export.confirmBody', {
              reason: t(REASON_LABEL[reason]),
              options: options.map((o) => t(OPTION_LABEL[o])).join(', '),
            }),
            [
              { text: t('saSettings.common.cancel'), style: 'cancel' },
              {
                text: t('saSettings.export.confirmAction'),
                style: 'destructive',
                onPress: () => onExport({ reason, details, options }),
              },
            ],
          );
        };

  return (
    <ScreenShell
      title={t('saSettings.export.title')}
      onBack={onBack}
      testID="saSettings.export"
      overlay={<DropdownModal state={dropdown} onClose={() => setDropdown(null)} />}
    >
      <View style={styles.emergencyWarningBox}>
        <WarningTriangleIcon color={adminColors.brand} />
        <Text style={styles.emergencyWarningText}>{t('saSettings.export.warning')}</Text>
      </View>

      <View style={styles.exportSectionGap}>
        <SectionTitle first>{t('saSettings.export.section.export')}</SectionTitle>
      </View>
      <View style={styles.formGroup}>
        <FieldLabel first>{t('saSettings.export.reason')}</FieldLabel>
        <SelectField
          value={reason === null ? t('saSettings.export.reasonPlaceholder') : t(REASON_LABEL[reason])}
          placeholder={reason === null}
          onPress={() =>
            setDropdown({
              title: t('saSettings.export.reasonTitle'),
              options: REASONS.map((r) => ({ value: r, label: t(REASON_LABEL[r]) })),
              selected: reason ?? '',
              onSelect: (v) => setReason(REASONS.find((r) => r === v) ?? null),
            })
          }
          testID="saSettings.export.reason"
        />
        <FieldLabel>{t('saSettings.export.details')}</FieldLabel>
        <TextInput
          style={styles.multiLineTextArea}
          multiline
          numberOfLines={4}
          maxLength={EXPORT_DETAILS_MAX}
          placeholder={t('saSettings.export.detailsPlaceholder')}
          placeholderTextColor={adminColors.placeholder}
          value={details}
          onChangeText={setDetails}
          testID="saSettings.export.details"
        />
        <Text style={styles.charCountText}>
          {t('saSettings.export.charCount', { count: details.length, max: EXPORT_DETAILS_MAX })}
        </Text>
      </View>

      <SectionTitle>{t('saSettings.export.section.options')}</SectionTitle>
      <View style={styles.formGroup}>
        {OPTIONS.map((opt) => (
          <CheckboxRow
            key={opt}
            label={t(OPTION_LABEL[opt])}
            checked={options.includes(opt)}
            onToggle={() => setOptions((prev) => toggleIn(prev, opt))}
            padded
            testID={`saSettings.export.option.${opt}`}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, styles.saveButtonSolo, submit === undefined && styles.disabled]}
        activeOpacity={0.8}
        onPress={submit}
        disabled={submit === undefined}
        testID="saSettings.export.submit"
      >
        <Text style={styles.saveButtonText}>{t('saSettings.export.submit')}</Text>
      </TouchableOpacity>
    </ScreenShell>
  );
}
