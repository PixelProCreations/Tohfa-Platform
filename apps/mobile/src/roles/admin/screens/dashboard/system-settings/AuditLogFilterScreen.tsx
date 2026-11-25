/**
 * Screen 5 of the design: the audit log filter (Date Range, User / Role,
 * Action Type, Module, Reset / Apply).
 *
 * What GET /admin/audit-log can filter on decides what each field offers:
 *   Date Range  -> `from` (All time / Today / Last 7 days / Last 30 days, IST)
 *   User / Role -> the API has no role filter (only an exact actorId): drawn
 *                  with "All Users" and disabled
 *   Action Type -> `action`, an exact action code: the options are the codes
 *                  seen in the entries loaded so far
 *   Module      -> `entityType`, exact: the entity types seen so far
 */
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { CalendarRangeIcon } from './systemSettingsIcons';
import {
  AUDIT_DATE_RANGES,
  DATE_RANGE_LABEL,
  DEFAULT_AUDIT_FILTER_DRAFT,
  type AuditFilterDraft,
} from './systemSettingsLogic';
import {
  DropdownModal,
  DualActions,
  FieldLabel,
  ScreenShell,
  SelectField,
  type DropdownOption,
  type DropdownState,
} from './SystemSettingsParts';
import { ssStyles as styles } from './systemSettingsStyles';

export interface AuditLogFilterScreenProps {
  initial: AuditFilterDraft;
  actionOptions: readonly string[];
  moduleOptions: readonly string[];
  onBack: () => void;
  onApply: (draft: AuditFilterDraft) => void;
}

const ALL = '__all__';

function withAll(allLabel: string, values: readonly string[]): DropdownOption[] {
  return [{ value: ALL, label: allLabel }, ...values.map((v) => ({ value: v, label: v }))];
}

export function AuditLogFilterScreen({ initial, actionOptions, moduleOptions, onBack, onApply }: AuditLogFilterScreenProps) {
  const [draft, setDraft] = useState<AuditFilterDraft>(initial);
  const [dropdown, setDropdown] = useState<DropdownState | null>(null);
  const reset = () => setDraft(DEFAULT_AUDIT_FILTER_DRAFT);

  return (
    <ScreenShell
      title={t('saSettings.filter.title')}
      onBack={onBack}
      testID="saSettings.filter"
      overlay={<DropdownModal state={dropdown} onClose={() => setDropdown(null)} />}
    >
      <View style={styles.filterBar}>
        <Text style={styles.filterBarTitle}>{t('saSettings.auditLog.filterBar')}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={reset} testID="saSettings.filter.clearAll">
          <Text style={styles.clearAllText}>{t('saSettings.common.clearAll')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <FieldLabel first>{t('saSettings.filter.dateRange')}</FieldLabel>
        <SelectField
          value={t(DATE_RANGE_LABEL[draft.dateRange])}
          leading={<CalendarRangeIcon />}
          onPress={() =>
            setDropdown({
              title: t('saSettings.filter.dateRangeTitle'),
              options: AUDIT_DATE_RANGES.map((r) => ({ value: r, label: t(DATE_RANGE_LABEL[r]) })),
              selected: draft.dateRange,
              onSelect: (value) =>
                setDraft((d) => ({ ...d, dateRange: AUDIT_DATE_RANGES.find((r) => r === value) ?? d.dateRange })),
            })
          }
          testID="saSettings.filter.dateRange"
        />

        <FieldLabel>{t('saSettings.filter.userRole')}</FieldLabel>
        <SelectField value={t('saSettings.filter.allUsers')} onPress={undefined} testID="saSettings.filter.userRole" />

        <FieldLabel>{t('saSettings.filter.actionType')}</FieldLabel>
        <SelectField
          value={draft.action ?? t('saSettings.filter.allActions')}
          onPress={() =>
            setDropdown({
              title: t('saSettings.filter.actionTypeTitle'),
              options: withAll(t('saSettings.filter.allActions'), actionOptions),
              selected: draft.action ?? ALL,
              onSelect: (value) => setDraft((d) => ({ ...d, action: value === ALL ? null : value })),
            })
          }
          testID="saSettings.filter.actionType"
        />

        <FieldLabel>{t('saSettings.filter.module')}</FieldLabel>
        <SelectField
          value={draft.entityType ?? t('saSettings.filter.allModules')}
          onPress={() =>
            setDropdown({
              title: t('saSettings.filter.moduleTitle'),
              options: withAll(t('saSettings.filter.allModules'), moduleOptions),
              selected: draft.entityType ?? ALL,
              onSelect: (value) => setDraft((d) => ({ ...d, entityType: value === ALL ? null : value })),
            })
          }
          testID="saSettings.filter.module"
        />
      </View>

      <DualActions
        secondary={{ label: t('saSettings.common.reset'), onPress: reset }}
        primary={{ label: t('saSettings.filter.apply'), onPress: () => onApply(draft) }}
        testID="saSettings.filter.actions"
      />
    </ScreenShell>
  );
}
