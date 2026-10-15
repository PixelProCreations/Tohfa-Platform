/**
 * Report Operational Issue: POST /warehouses/{id}/issues
 * (warehouse.issue.manage, Main all, Sub own; BR-103).
 *
 * The form sends exactly the API's fields: category and severity (the
 * server's fixed lists), a title (1-160) and an optional description (up to
 * 4000). The reporter is the caller and the status always starts OPEN.
 *
 * The old form's location picker and photo attachment are gone on purpose:
 * an issue has no location field and there is no attachment endpoint, so the
 * photo was never stored anywhere. The Help & Support request ('support'
 * mode of ReportIssueScreen) is a separate screen and is unchanged.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import {
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  type IssueCategoryCode,
  type IssueSeverityCode,
  type WarehouseIssueDto,
} from '../../../api/warehouseIssues';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { ChipGroup, PermissionNote, WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import {
  buildCreateIssueBody,
  ISSUE_LIMITS,
  issueCategoryLabel,
  issueSeverityLabel,
  type IssueDraftField,
} from './mappers';
import { SendIcon, STORAGE_CODES } from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import { useCreateIssue } from './useStorageData';
import type { WarehouseScreenBaseProps } from './types';

export interface ReportOperationalIssueScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  /** The created issue, as the server returned it. */
  onCreated: (issue: WarehouseIssueDto) => void;
}

const NONE = '';

export function ReportOperationalIssueScreen({ can, onBack, warehouse, onCreated }: ReportOperationalIssueScreenProps) {
  const [category, setCategory] = useState<IssueCategoryCode | typeof NONE>(NONE);
  const [severity, setSeverity] = useState<IssueSeverityCode | typeof NONE>(NONE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Partial<Record<IssueDraftField, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const create = useCreateIssue(warehouse.warehouseId);
  const canReport = can(STORAGE_CODES.issueManage);

  const submit = () => {
    const built = buildCreateIssueBody({
      category: category === NONE ? undefined : category,
      severity: severity === NONE ? undefined : severity,
      title,
      description,
    });
    if (!built.ok) {
      setErrors(Object.fromEntries(Object.entries(built.errors).map(([field, key]) => [field, t(key)])));
      return;
    }
    setErrors({});
    setSubmitError(undefined);
    create.mutate(built.body, {
      onSuccess: onCreated,
      onError: (err) => setSubmitError(t(adminErrorKey(err))),
    });
  };

  const ready = canReport && warehouse.warehouseId !== undefined;

  return (
    <WalletScreen
      title={t('storageOps.report.title')}
      onBack={onBack}
      headerExtra={warehouse.header}
      footer={
        ready ? (
          <WalletFooter>
            <WalletButton label={t('storageOps.report.submit')} icon={<SendIcon />} onPress={submit} disabled={create.isPending} />
          </WalletFooter>
        ) : undefined
      }
    >
      {warehouse.placeholder ?? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!canReport ? <PermissionNote>{t('storageOps.report.noPermission')}</PermissionNote> : null}

          <Text style={styles.label}>{t('storageOps.report.category')}</Text>
          <ChipGroup
            options={ISSUE_CATEGORIES}
            // Nothing is picked until the admin taps a chip ('' matches no option).
            value={category as IssueCategoryCode}
            onChange={setCategory}
            labelOf={issueCategoryLabel}
          />
          {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}

          <Text style={styles.label}>{t('storageOps.report.severity')}</Text>
          <ChipGroup options={ISSUE_SEVERITIES} value={severity as IssueSeverityCode} onChange={setSeverity} labelOf={issueSeverityLabel} />
          {errors.severity ? <Text style={styles.error}>{errors.severity}</Text> : null}

          <Text style={styles.label}>{t('storageOps.report.issueTitle')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('storageOps.report.titlePlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={title}
            onChangeText={setTitle}
            maxLength={ISSUE_LIMITS.title}
          />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('storageOps.report.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('storageOps.report.descriptionPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={description}
            onChangeText={setDescription}
            maxLength={ISSUE_LIMITS.description}
            multiline
            textAlignVertical="top"
          />
          {errors.description ? <Text style={styles.error}>{errors.description}</Text> : null}

          {submitError !== undefined ? <Text style={styles.error}>{submitError}</Text> : null}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  label: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.md, marginBottom: adminSpacing.sm },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  textArea: { minHeight: adminSpacing.xxl * 3 },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
});
