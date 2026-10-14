/**
 * Inspect a PENDING return — `POST /admin/returns/{id}/inspect`
 * (`inventory.quality_check.perform`, BR-61).
 *
 * Every item needs a condition (GOOD/DAMAGED/SPOILED, the API values) and an
 * accepted quantity; damaged defaults to 0. Validation and the wire body are
 * mappers.ts `validateInspectionForm` (quantities via integer grams, never a
 * float). Nothing is pre-filled. On success the flow returns to the detail,
 * whose cache the mutation invalidated.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@tohfa/mobile-ui';
import { useAdminMutation } from '../../../api/hooks';
import { inspectReturn, RETURN_ITEM_CONDITIONS, type ReturnInspectionBody } from '../../../api/returns';
import { t, type TranslationKey } from '../../../i18n';
import { formatGramsAsKg } from '../../../money/quantity';
import { adminTheme } from '../../../theme';
import { FilterChips } from '../shared/FilterChips';
import { InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import {
  emptyInspectionForm,
  returnConditionLabelKey,
  returnTransitionInvalidationKeys,
  returnWriteErrorKey,
  validateInspectionForm,
  type InspectionForm,
  type InspectionItemErrors,
  type InspectionItemForm,
  type ReturnDetail,
} from './mappers';

const { colors, spacing, typography, weights } = adminTheme;

export function ReturnInspectScreen(props: {
  detail: ReturnDetail;
  warehouseId: string | null;
  onBack: () => void;
  onDone: () => void;
}): React.JSX.Element {
  const { detail } = props;
  const [form, setForm] = useState<InspectionForm>(() => emptyInspectionForm(detail));
  const [errors, setErrors] = useState<Record<string, InspectionItemErrors>>({});
  const mutation = useAdminMutation((body: ReturnInspectionBody) => inspectReturn(detail.id, body), {
    invalidate: returnTransitionInvalidationKeys(props.warehouseId),
    onSuccess: () => props.onDone(),
  });

  const update = (orderItemId: string, patch: Partial<InspectionItemForm>, clear: keyof InspectionItemErrors): void => {
    setForm((f) => {
      const current = f[orderItemId] ?? { condition: null, acceptedText: '', damagedText: '' };
      return { ...f, [orderItemId]: { ...current, ...patch } };
    });
    setErrors((e) => {
      const itemErrors = e[orderItemId];
      if (itemErrors === undefined) return e;
      const { [clear]: _cleared, ...rest } = itemErrors;
      return { ...e, [orderItemId]: rest };
    });
  };

  const submit = (): void => {
    if (mutation.isPending) return;
    const result = validateInspectionForm(detail, form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    mutation.mutate(result.body);
  };

  const err = (key: TranslationKey | undefined): string | undefined => (key === undefined ? undefined : t(key));
  const conditionOptions = RETURN_ITEM_CONDITIONS.map((c) => ({
    key: c,
    value: c,
    label: t(returnConditionLabelKey(c)),
  }));

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title={t('admin.returns.inspect.title')}
        onBack={mutation.isPending ? undefined : props.onBack}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.returns.inspect.intro')}
        </Text>
        {detail.items.map((item, index) => {
          const entry = form[item.orderItemId] ?? { condition: null, acceptedText: '', damagedText: '' };
          const itemErrors = errors[item.orderItemId] ?? {};
          return (
            <InfoSection key={item.id} title={t('admin.returns.detail.itemTitle', { n: index + 1 })}>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>
                {t('admin.returns.inspect.requestedHint', { qty: formatGramsAsKg(item.requestedGrams) })}
              </Text>
              <Text style={{ color: colors.onSurface, fontSize: typography.body, fontWeight: weights.medium }}>
                {t('admin.returns.inspect.conditionLabel')}
              </Text>
              <FilterChips
                accessibilityLabel={t('admin.returns.inspect.conditionLabel')}
                options={conditionOptions}
                selectedKey={entry.condition ?? ''}
                onSelect={(condition) => update(item.orderItemId, { condition }, 'condition')}
              />
              {itemErrors.condition === undefined ? null : (
                <Text style={{ color: colors.error, fontSize: typography.caption }}>{t(itemErrors.condition)}</Text>
              )}
              <Input
                label={t('admin.returns.inspect.accepted')}
                value={entry.acceptedText}
                onChangeText={(acceptedText) => update(item.orderItemId, { acceptedText }, 'accepted')}
                keyboardType="decimal-pad"
                error={err(itemErrors.accepted)}
              />
              <Input
                label={t('admin.returns.inspect.damaged')}
                value={entry.damagedText}
                onChangeText={(damagedText) => update(item.orderItemId, { damagedText }, 'damaged')}
                keyboardType="decimal-pad"
                error={err(itemErrors.damaged)}
              />
            </InfoSection>
          );
        })}
        {mutation.isError ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
            {t(returnWriteErrorKey(mutation.error))}
          </Text>
        ) : null}
        <Button
          title={t('admin.returns.inspect.submit')}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onPress={submit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
