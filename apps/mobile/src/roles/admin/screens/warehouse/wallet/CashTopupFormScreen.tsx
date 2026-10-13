/**
 * Cash top-up, step 1: amount, fiscal cash tag, remarks.
 *
 * Validation is mappers.ts `validateCashTopupForm` (BR-18 tag, BR-19 cap as a
 * UX guard); nothing is sent from here — the write happens only on the
 * confirm screen.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@tohfa/mobile-ui';
import { CASH_TOPUP_CAP_PAISE } from '../../../config/businessThresholds';
import { t, type TranslationKey } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminTheme } from '../../../theme';
import { InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import { TopupCustomerCard } from './TopupCustomerCard';
import {
  validateCashTopupForm,
  type CashTopupForm,
  type TopupCustomer,
  type ValidCashTopup,
} from './mappers';

const { colors, spacing, typography } = adminTheme;

type FieldErrors = { amount?: TranslationKey; fiscalTag?: TranslationKey; remarks?: TranslationKey };

export function CashTopupFormScreen(props: {
  customer: TopupCustomer;
  initialForm: CashTopupForm;
  onBack: () => void;
  onContinue: (form: CashTopupForm, value: ValidCashTopup) => void;
}): React.JSX.Element {
  const [form, setForm] = useState<CashTopupForm>(props.initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const cap = formatPaise(CASH_TOPUP_CAP_PAISE);

  const set = (field: keyof CashTopupForm, errorField: keyof FieldErrors) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const { [errorField]: _cleared, ...rest } = e;
      return rest;
    });
  };

  const next = (): void => {
    const result = validateCashTopupForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    props.onContinue(form, result.value);
  };

  const err = (key: TranslationKey | undefined): string | undefined =>
    key === undefined ? undefined : t(key, { cap });

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.wallet.topup.title')} onBack={props.onBack} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <TopupCustomerCard customer={props.customer} />
        <InfoSection>
          <Input
            label={t('admin.wallet.topup.amount')}
            value={form.amountText}
            onChangeText={set('amountText', 'amount')}
            keyboardType="decimal-pad"
            error={err(errors.amount)}
          />
          <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>
            {t('admin.wallet.topup.amountHint', { cap })}
          </Text>
          <Input
            label={t('admin.wallet.topup.fiscalTag')}
            value={form.fiscalTag}
            onChangeText={set('fiscalTag', 'fiscalTag')}
            autoCapitalize="characters"
            autoCorrect={false}
            error={err(errors.fiscalTag)}
          />
          <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>
            {t('admin.wallet.topup.fiscalTagHint')}
          </Text>
          <Input
            label={t('admin.wallet.topup.remarks')}
            value={form.remarks}
            onChangeText={set('remarks', 'remarks')}
            multiline
            error={err(errors.remarks)}
          />
        </InfoSection>
        <Button title={t('admin.wallet.topup.continue')} onPress={next} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
