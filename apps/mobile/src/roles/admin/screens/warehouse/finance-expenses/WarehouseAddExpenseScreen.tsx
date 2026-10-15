/**
 * Record an expense (BR-62): POST /admin/expenses, finance.expense.log.
 *
 * One form for both warehouse roles. A Sub admin records against its own
 * warehouse (scope, BR-30); a Main admin is not assigned to one, so it must
 * pick one from the live GET /warehouses list before saving.
 *
 * Record only: there is no PATCH /admin/expenses/{id} and no category write
 * endpoint, so there is no edit mode and no "add category" here. Categories
 * come from GET /admin/expense-categories (uuid ids).
 *
 * No receipt control: ExpenseCreate (apps/api finance.schema.ts) is strict and
 * carries no receipt field, so a photo picked here could never be stored.
 *
 * The body is built and validated by buildExpenseCreateBody (mappers.ts,
 * covered by plain-Node tests); money goes out as a decimal string built from
 * integer paise, never a float. The Idempotency-Key is tied to the body, so a
 * retry after a network error replays the same write (root CLAUDE.md 2.4).
 * The server re-checks the permission and the scope (CLAUDE.md 2.1).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ExpensePaymentMethod } from '../../../api/finance';
import { adminErrorKey } from '../../../api/errors';
import { useIdempotencyKey } from '../../../api/hooks';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  ChipGroup,
  InfoNote,
  ScopeHeader,
  SectionHint,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { FINANCE_CODES, FinanceNotAvailable, scopeLabel, useFinanceWarehousePicker } from './FinanceParts';
import {
  buildExpenseCreateBody,
  EXPENSE_PAYMENT_METHODS,
  expensePaymentMethodLabel,
  istToday,
  type ExpenseFormError,
} from './mappers';
import type { WarehouseScreenBaseProps } from './types';
import { useCreateExpenseMutation, useExpenseCategories } from './useFinanceData';

export interface WarehouseAddExpenseScreenProps extends WarehouseScreenBaseProps {
  /** Called with the new expense's uuid; the flow replaces this form with its detail. */
  onSaveSuccess: (expenseId: string) => void;
}

const FIELD_ERROR_KEY: Readonly<Record<ExpenseFormError, TranslationKey>> = {
  category: 'finance.addExpense.error.category',
  amount: 'finance.addExpense.error.amount',
  date: 'finance.addExpense.error.date',
  paymentMethod: 'finance.addExpense.error.paymentMethod',
  warehouse: 'finance.addExpense.error.warehouse',
};

export function WarehouseAddExpenseScreen(props: WarehouseAddExpenseScreenProps) {
  if (!props.can(FINANCE_CODES.expenseLog)) {
    return (
      <FinanceNotAvailable
        title={t('finance.addExpense.title')}
        message={t('finance.notAvailable.message')}
        onBack={props.onBack}
      />
    );
  }
  // The form lives in its own component so its hooks never run for a viewer without the code.
  return <AddExpenseForm {...props} />;
}

function AddExpenseForm({ scope, can, onBack, onSaveSuccess }: WarehouseAddExpenseScreenProps) {
  const picker = useFinanceWarehousePicker(scope, can);
  const categories = useExpenseCategories();
  const mutation = useCreateExpenseMutation();
  const idempotency = useIdempotencyKey();

  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [amountText, setAmountText] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => istToday());
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod | undefined>(undefined);
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  // Field errors appear only after the first Save, then follow the input live.
  const [attempted, setAttempted] = useState(false);

  const draft = buildExpenseCreateBody(
    { categoryId, amountText, expenseDate, paymentMethod, vendor, description, warehouseId: picker.warehouseId },
    scope,
  );
  const errors: readonly ExpenseFormError[] = attempted && !draft.ok ? draft.errors : [];
  const fieldError = (field: ExpenseFormError) =>
    errors.includes(field) ? <Text style={styles.fieldError}>{t(FIELD_ERROR_KEY[field])}</Text> : null;

  const save = () => {
    setAttempted(true);
    if (!draft.ok || mutation.isPending) return;
    const body = draft.body;
    mutation.mutate(
      { body, idempotencyKey: idempotency.keyFor(body) },
      {
        onSuccess: (expense) => {
          idempotency.reset();
          onSaveSuccess(expense.id);
        },
      },
    );
  };

  const header = picker.isMain ? (
    <ScopeHeader
      scope={scope}
      warehouseOptions={picker.options}
      selectedWarehouseId={picker.selectedId}
      onSelectWarehouse={picker.setSelectedId}
    />
  ) : (
    <ScopeHeader scope={scope} label={scopeLabel(scope)} />
  );

  return (
    <WalletScreen
      title={t('finance.addExpense.title')}
      onBack={onBack}
      headerExtra={header}
      footer={
        <WalletFooter>
          <WalletButton
            label={mutation.isPending ? t('finance.addExpense.saving') : t('finance.addExpense.save')}
            onPress={save}
            disabled={mutation.isPending}
          />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} keyboardShouldPersistTaps="handled">
        {picker.isMain && picker.error ? (
          <View style={styles.block}>
            <InfoNote tone="danger">{t('finance.picker.loadError')}</InfoNote>
            <WalletButton label={t('async.retry')} variant="outline" onPress={picker.refresh} />
          </View>
        ) : null}
        {picker.isMain && picker.warehouseId === undefined ? (
          <View style={styles.block}>
            <InfoNote tone={errors.includes('warehouse') ? 'danger' : 'info'}>
              {errors.includes('warehouse') ? t('finance.addExpense.error.warehouse') : t('finance.picker.pickWarehouse')}
            </InfoNote>
          </View>
        ) : null}

        <SectionTitle right={<SectionHint>{t('finance.addExpense.required')}</SectionHint>}>
          {t('finance.addExpense.section.category')}
        </SectionTitle>
        {categories.isLoading ? (
          <AdminLoadingState label={t('finance.addExpense.category.loading')} />
        ) : categories.error ? (
          <AdminErrorState error={categories.error} onRetry={categories.refresh} />
        ) : categories.categories.length === 0 ? (
          <AdminEmptyState
            title={t('finance.addExpense.category.emptyTitle')}
            subtitle={t('finance.addExpense.category.emptySubtitle')}
          />
        ) : (
          <ChipGroup
            options={categories.categories.map((c) => c.id)}
            value={categoryId ?? ''}
            onChange={setCategoryId}
            labelOf={(id) => categories.categories.find((c) => c.id === id)?.name ?? id}
          />
        )}
        {fieldError('category')}

        <SectionTitle right={<SectionHint>{t('finance.addExpense.required')}</SectionHint>}>
          {t('finance.addExpense.section.amount')}
        </SectionTitle>
        <TextInput
          style={[styles.input, errors.includes('amount') && styles.inputError]}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          placeholder={t('finance.addExpense.amount.placeholder')}
          placeholderTextColor={adminColors.placeholder}
          accessibilityLabel={t('finance.addExpense.amount.a11y')}
        />
        {fieldError('amount')}

        <SectionTitle right={<SectionHint>{t('finance.addExpense.required')}</SectionHint>}>
          {t('finance.addExpense.section.date')}
        </SectionTitle>
        <TextInput
          style={[styles.input, errors.includes('date') && styles.inputError]}
          value={expenseDate}
          onChangeText={setExpenseDate}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          accessibilityLabel={t('finance.addExpense.date.a11y')}
        />
        <Text style={styles.hint}>{t('finance.addExpense.date.hint')}</Text>
        {fieldError('date')}

        <SectionTitle right={<SectionHint>{t('finance.addExpense.required')}</SectionHint>}>
          {t('finance.addExpense.section.paymentMethod')}
        </SectionTitle>
        <ChipGroup<string>
          options={EXPENSE_PAYMENT_METHODS}
          value={paymentMethod ?? ''}
          onChange={(next) => setPaymentMethod(EXPENSE_PAYMENT_METHODS.find((m) => m === next))}
          labelOf={(m) => expensePaymentMethodLabel(EXPENSE_PAYMENT_METHODS.find((x) => x === m) ?? null) || m}
        />
        {fieldError('paymentMethod')}

        <SectionTitle right={<SectionHint>{t('finance.addExpense.optional')}</SectionHint>}>
          {t('finance.addExpense.section.vendor')}
        </SectionTitle>
        <TextInput
          style={styles.input}
          value={vendor}
          onChangeText={setVendor}
          placeholder={t('finance.addExpense.vendor.placeholder')}
          placeholderTextColor={adminColors.placeholder}
          accessibilityLabel={t('finance.addExpense.vendor.a11y')}
        />

        <SectionTitle right={<SectionHint>{t('finance.addExpense.optional')}</SectionHint>}>
          {t('finance.addExpense.section.description')}
        </SectionTitle>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          placeholder={t('finance.addExpense.description.placeholder')}
          placeholderTextColor={adminColors.placeholder}
          accessibilityLabel={t('finance.addExpense.description.a11y')}
        />

        <View style={styles.block}>
          <InfoNote>{t('finance.addExpense.note.recordOnly')}</InfoNote>
        </View>
        {mutation.error ? (
          <View style={styles.block}>
            <InfoNote tone="danger">{t(adminErrorKey(mutation.error))}</InfoNote>
          </View>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  block: { gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  inputError: { borderColor: adminColors.danger.text },
  textArea: { minHeight: adminSpacing.page * 2 },
  hint: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  fieldError: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
});
