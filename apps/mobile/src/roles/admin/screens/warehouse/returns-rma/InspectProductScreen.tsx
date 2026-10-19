/**
 * Inspect Returned Product — record what came back, per item, on
 * POST /admin/returns/{id}/inspect (plan phase 10), then the folded
 * "Inspection Saved" step.
 *
 * Per item: the condition (Acceptable / Damaged / Spoiled = GOOD / DAMAGED /
 * SPOILED), the accepted quantity and the damaged quantity in kg. Nothing is
 * prefilled: every figure is the inspector's own. inspectionBody checks every
 * item before anything is sent, and pins each problem to its item; accepted +
 * damaged is checked SUMMED per item against the returned quantity, as the
 * DB constraint return_request_items_qty_balance_chk does (BR-61).
 *
 * Gates: Save needs inventory.quality_check.perform and a PENDING return
 * (returnActions); the server re-checks (409 INVALID_STATE_TRANSITION).
 *
 * Hidden, because the inspect body has no such field: the inspection result
 * dropdown, the notes and the inspection photos.
 */
// Design id: M10-S03
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { ReturnInspectionBody } from '../../../api/returns';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { conditionLabel, INSPECTION_CONDITIONS, inspectionBody, returnActions, returnWriteErrorKey, type InspectionFormItem } from './mappers';
import { ActionError, PermissionNote, ResultHero, ReturnDetailGate, ReturnsButton, ReturnsFooter, ReturnsScreen, SectionTitle } from './ReturnsParts';
import type { InspectStep, ReturnDetailView, ReturnItemView, ReturnsLiveStateProps, ReturnsWriteStateProps, WarehouseScreenBaseProps } from './types';

export interface InspectProductScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps, ReturnsWriteStateProps {
  detail: ReturnDetailView | undefined;
  notFound?: boolean | undefined;
  step: InspectStep;
  onSubmit: (body: ReturnInspectionBody) => void;
  onContinueToReview: () => void;
}

const EMPTY_ITEM: InspectionFormItem = { condition: undefined, accepted: '', damaged: '' };

function BigCheckIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" />
      <Path d="M7.5 12.5l3 3 6-6.5" stroke={adminColors.success.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface ItemFormProps {
  index: number;
  item: ReturnItemView;
  value: InspectionFormItem;
  errorKey: TranslationKey | undefined;
  editable: boolean;
  onChange: (next: InspectionFormItem) => void;
}

function ItemForm({ index, item, value, errorKey, editable, onChange }: ItemFormProps) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{t('returns.item.title', { n: index + 1 })}</Text>
        <Text style={styles.itemMeta}>{t('returns.inspect.requested', { qty: formatKg(item.requestedGrams) })}</Text>
      </View>

      <Text style={styles.label}>{t('returns.item.condition')}</Text>
      <View style={styles.conditionRow}>
        {INSPECTION_CONDITIONS.map((condition) => {
          const selected = value.condition === condition;
          return (
            <TouchableOpacity
              key={condition}
              style={[styles.condBtn, selected && styles.condBtnActive]}
              onPress={() => onChange({ ...value, condition })}
              disabled={!editable}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !editable }}
            >
              <Text style={[styles.condBtnText, selected && styles.condBtnTextActive]}>{conditionLabel(condition)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.qtyRow}>
        <View style={styles.qtyCol}>
          <Text style={styles.label}>{t('returns.inspect.acceptedLabel')}</Text>
          <TextInput
            style={styles.qtyInput}
            value={value.accepted}
            onChangeText={(accepted) => onChange({ ...value, accepted })}
            keyboardType="decimal-pad"
            placeholder={t('returns.inspect.qtyPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            editable={editable}
            accessibilityLabel={t('returns.inspect.acceptedLabel')}
          />
        </View>
        <View style={styles.qtyCol}>
          <Text style={styles.label}>{t('returns.inspect.damagedLabel')}</Text>
          <TextInput
            style={styles.qtyInput}
            value={value.damaged}
            onChangeText={(damaged) => onChange({ ...value, damaged })}
            keyboardType="decimal-pad"
            placeholder={t('returns.inspect.qtyPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            editable={editable}
            accessibilityLabel={t('returns.inspect.damagedLabel')}
          />
        </View>
      </View>

      {errorKey ? <Text style={styles.fieldError}>{t(errorKey)}</Text> : null}
    </View>
  );
}

export function InspectProductScreen({
  can,
  onBack,
  detail,
  notFound,
  step,
  onSubmit,
  onContinueToReview,
  isSubmitting = false,
  submitError,
  isLoading,
  error,
  onRetry,
}: InspectProductScreenProps) {
  const [form, setForm] = useState<Record<string, InspectionFormItem>>({});
  // Shown only after a Save attempt, so an empty form does not open in red.
  const [itemErrors, setItemErrors] = useState<Readonly<Record<string, TranslationKey>>>({});
  const canInspect = detail !== undefined && returnActions(detail.status, can).inspect;

  if (step === 'saved') {
    return (
      <ReturnsScreen
        title={t('returns.inspect.title')}
        subtitle={detail?.reference}
        onBack={onBack}
        footer={
          <ReturnsFooter>
            <ReturnsButton label={t('returns.inspect.continue')} onPress={onContinueToReview} />
          </ReturnsFooter>
        }
      >
        <ResultHero tone="success" icon={<BigCheckIcon />} title={t('returns.inspect.savedTitle')} subtitle={t('returns.inspect.savedSubtitle')} />
      </ReturnsScreen>
    );
  }

  const save = () => {
    if (detail === undefined) return;
    const result = inspectionBody(detail.items, form);
    if (!result.ok) {
      setItemErrors(result.itemErrors);
      return;
    }
    setItemErrors({});
    onSubmit(result.body);
  };

  return (
    <ReturnsScreen
      title={t('returns.inspect.title')}
      subtitle={detail?.reference}
      onBack={onBack}
      footer={
        detail === undefined ? null : (
          <ReturnsFooter>
            <ReturnsButton
              label={t(isSubmitting ? 'returns.inspect.saving' : 'returns.inspect.save')}
              disabled={!canInspect || isSubmitting}
              onPress={save}
            />
            {canInspect ? null : <PermissionNote>{t('returns.detail.noAction')}</PermissionNote>}
          </ReturnsFooter>
        )
      }
    >
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {submitError !== null && submitError !== undefined ? <ActionError messageKey={returnWriteErrorKey(submitError)} /> : null}
            <SectionTitle>{t('returns.detail.reason')}</SectionTitle>
            <Text style={styles.reason}>{d.reason}</Text>
            <SectionTitle>{t('returns.detail.items')}</SectionTitle>
            <Text style={styles.hint}>{t('returns.inspect.hint')}</Text>
            {d.items.map((item, index) => (
              <ItemForm
                key={item.orderItemId}
                index={index}
                item={item}
                value={form[item.orderItemId] ?? EMPTY_ITEM}
                errorKey={itemErrors[item.orderItemId]}
                editable={canInspect && !isSubmitting}
                onChange={(next) => setForm((prev) => ({ ...prev, [item.orderItemId]: next }))}
              />
            ))}
          </ScrollView>
        )}
      </ReturnDetailGate>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  reason: { ...adminType.body, color: adminColors.ink },
  hint: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.sm },
  itemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.sm },
  itemTitle: { ...adminType.rowTitle, color: adminColors.ink },
  itemMeta: { ...adminType.rowMeta, color: adminColors.muted },
  label: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  conditionRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  condBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  condBtnActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  condBtnText: { ...adminType.caption, color: adminColors.ink },
  condBtnTextActive: { color: adminColors.brandDeep },
  qtyRow: { flexDirection: 'row', gap: adminSpacing.md },
  qtyCol: { flex: 1 },
  qtyInput: {
    ...adminType.body,
    color: adminColors.ink,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    backgroundColor: adminColors.card,
  },
  fieldError: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.sm },
});
