import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAdminMutation } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  createWarehouseIssue,
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  type IssueCategoryCode,
  type IssueSeverityCode,
} from '../../../api/warehouseIssues';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  AdminEmptyState,
  AdminErrorState,
} from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  isAllWarehouses,
  ScopeHeader,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { ChevronDownIcon, SendIcon } from './StorageParts';
import type { IssueSeverity, ReportIssueMode, WarehouseScreenBaseProps } from './types';

export interface ReportIssueSubmission {
  mode: ReportIssueMode;
  category: string;
  specificIssue: string;
  subject: string;
  description: string;
  referenceId?: string | undefined;
  attachmentName?: string | undefined;
  warehouseId?: string | undefined;
  location?: string | undefined;
  issueCategory?: string | undefined;
  severity?: IssueSeverity | undefined;
}

export interface ReportIssueScreenProps extends WarehouseScreenBaseProps {
  mode?: ReportIssueMode | undefined;
  initialCategory?: string | undefined;
  onSubmit: (submittedId: string, submission: ReportIssueSubmission) => void;
}

export function ReportIssueScreen({
  scope,
  onBack,
  mode = 'operational',
  initialCategory,
  onSubmit,
}: ReportIssueScreenProps) {
  const isSupport = mode === 'support';
  const { options, scopes } = useWarehouseOptions();
  const allWarehouses = isAllWarehouses(scope);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    scope.warehouseId ?? options[0]?.warehouseId,
  );
  const [category, setCategory] = useState<IssueCategoryCode>('STORAGE');
  const [severity, setSeverity] = useState<IssueSeverityCode>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [severityPickerOpen, setSeverityPickerOpen] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;

  const createMutation = useAdminMutation({
    mutationFn: (body: {
      category: IssueCategoryCode;
      severity: IssueSeverityCode;
      title: string;
      description?: string;
    }) => createWarehouseIssue(effectiveWarehouseId as string, body),
    invalidates: [adminKeys.module('warehouseIssues')],
  });

  if (isSupport) {
    return (
      <WalletScreen title={t('storageOps.report.title')} onBack={onBack}>
        <AdminEmptyState
          title={t('storageOps.report.supportUnavailable')}
          subtitle={t('storageOps.issues.notAvailable.subtitle')}
        />
      </WalletScreen>
    );
  }

  const isValid = subject.trim().length > 0 && !!effectiveWarehouseId;

  const handleSubmit = async () => {
    if (!isValid || createMutation.isPending) return;
    setSubmitError(null);
    try {
      const trimmedDesc = description.trim();
      const res = await createMutation.mutateAsync({
        category,
        severity,
        title: subject.trim(),
        ...(trimmedDesc ? { description: trimmedDesc } : {}),
      });
      onSubmit(res.issueNumber, {
        mode,
        category,
        specificIssue: subject.trim(),
        subject: subject.trim(),
        description: description.trim(),
        warehouseId: effectiveWarehouseId,
        severity: severity as IssueSeverity,
      });
    } catch (err) {
      setSubmitError(err);
    }
  };

  return (
    <WalletScreen
      title={t('storageOps.report.title')}
      onBack={onBack}
      headerExtra={
        allWarehouses ? (
          <ScopeHeader
            scope={scope}
            warehouseOptions={scopes}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={setSelectedWarehouseId}
          />
        ) : undefined
      }
      footer={
        <WalletFooter>
          <WalletButton
            label={t('storageOps.report.submit')}
            icon={<SendIcon size={18} color={adminColors.onBrand} />}
            disabled={!isValid || createMutation.isPending}
            onPress={handleSubmit}
          />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {submitError ? (
          <View style={styles.errorBanner}>
            <AdminErrorState error={submitError} onRetry={handleSubmit} />
          </View>
        ) : null}

        {/* Category Picker */}
        <Text style={styles.fieldLabel}>
          {t('storageOps.report.category')} <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setCategoryPickerOpen((prev) => !prev)}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.pickerButtonText}>{t(`storageOps.issues.category.${category}`)}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {categoryPickerOpen ? (
          <View style={styles.dropdown}>
            {ISSUE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.dropdownItem, category === cat && styles.dropdownItemSelected]}
                onPress={() => {
                  setCategory(cat);
                  setCategoryPickerOpen(false);
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.dropdownItemText, category === cat && styles.dropdownItemTextSelected]}>
                  {t(`storageOps.issues.category.${cat}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Severity Picker */}
        <Text style={styles.fieldLabel}>
          {t('storageOps.report.severity')} <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setSeverityPickerOpen((prev) => !prev)}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.pickerButtonText}>{t(`storageOps.issues.severity.${severity}`)}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {severityPickerOpen ? (
          <View style={styles.dropdown}>
            {ISSUE_SEVERITIES.map((sev) => (
              <TouchableOpacity
                key={sev}
                style={[styles.dropdownItem, severity === sev && styles.dropdownItemSelected]}
                onPress={() => {
                  setSeverity(sev);
                  setSeverityPickerOpen(false);
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.dropdownItemText, severity === sev && styles.dropdownItemTextSelected]}>
                  {t(`storageOps.issues.severity.${sev}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Subject */}
        <Text style={styles.fieldLabel}>
          {t('storageOps.report.subject')} <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder={t('storageOps.report.subjectPlaceholder')}
          placeholderTextColor={adminColors.muted}
          maxLength={160}
        />

        {/* Description */}
        <Text style={styles.fieldLabel}>{t('storageOps.report.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('storageOps.report.descriptionPlaceholder')}
          placeholderTextColor={adminColors.muted}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
    marginTop: adminSpacing.md,
  },
  required: {
    color: adminColors.danger.text,
  },
  input: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdown: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: adminSpacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownItemSelected: {
    backgroundColor: adminColors.canvas,
  },
  dropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
    color: adminColors.brand,
  },
  errorBanner: {
    marginBottom: adminSpacing.md,
  },
});