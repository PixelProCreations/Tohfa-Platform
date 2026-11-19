import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';

import type { ExpensePaymentMethod } from '../../api/finance';
import { adminErrorKey } from '../../api/errors';
import { useIdempotencyKey } from '../../api/hooks';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { moneyText } from '../dashboard/saOverviewFormat';
import { useWarehouseOptions } from '../warehouse/shared/useWarehouseOptions';
import {
  buildExpenseCreateBody,
  EXPENSE_PAYMENT_METHODS,
  expensePaymentMethodLabel,
  istToday,
  type ExpenseFormError,
} from '../warehouse/finance-expenses/mappers';
import { useCreateExpenseMutation, useExpenseCategories } from '../warehouse/finance-expenses/useFinanceData';

/** docs/rbac.json codes: POST /admin/expenses and the warehouse picker's GET /warehouses. */
const EXPENSE_LOG_CODE = 'finance.expense.log';
const WAREHOUSE_LIST_CODE = 'warehouse.all.view';

const FIELD_ERROR_KEY: Readonly<Record<ExpenseFormError, TranslationKey>> = {
  category: 'finance.addExpense.error.category',
  amount: 'finance.addExpense.error.amount',
  date: 'finance.addExpense.error.date',
  paymentMethod: 'finance.addExpense.error.paymentMethod',
  warehouse: 'finance.addExpense.error.warehouse',
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314',
  orange:        '#E85226',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  chipActiveBg:  '#FFF2EB',
  chipActiveText:'#E85226',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface AddExpenseScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
  /** Permission check from /auth/me. Missing denies the submit (fail closed, root CLAUDE.md 2.1). */
  can?: Can | undefined;
}

export function AddExpenseScreen({ onBack, onSuccess, can }: AddExpenseScreenProps) {
  const has = (code: string): boolean => typeof can === 'function' && can(code);
  const allowed = has(EXPENSE_LOG_CODE);
  // Real ids: the server takes an ACTIVE category uuid and a warehouse uuid, never the names.
  const categories = useExpenseCategories(allowed);
  const warehouses = useWarehouseOptions({ enabled: allowed && has(WAREHOUSE_LIST_CODE), activeOnly: true });
  const mutation = useCreateExpenseMutation();
  const idempotency = useIdempotencyKey();

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod | undefined>(undefined);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const submitting = mutation.isPending;

  function handleSubmit() {
    if (!allowed || submitting) return;
    if (!amount.trim()) {
      Alert.alert('Missing Field', 'Please enter the expense amount in rupees.');
      return;
    }
    // Amount goes paise -> decimal string inside the builder; no float is involved.
    const draft = buildExpenseCreateBody(
      {
        categoryId: selectedCategory,
        amountText: amount,
        expenseDate: istToday(),
        paymentMethod,
        vendor: '',
        description: notes,
        warehouseId: selectedWarehouse,
      },
      {},
    );
    if (!draft.ok) {
      const first = draft.errors[0];
      Alert.alert('Missing Field', first === undefined ? t('admin.error.generic') : t(FIELD_ERROR_KEY[first]));
      return;
    }
    const body = draft.body;
    // A retry after a dropped response replays the same key, so the expense is recorded once.
    mutation.mutate(
      { body, idempotencyKey: idempotency.keyFor(body) },
      {
        onSuccess: (expense) => {
          idempotency.reset();
          Alert.alert(
            t('addExpenseLive.done.title'),
            t('addExpenseLive.done.body', { amount: moneyText(expense.amount), category: expense.category }),
            [
              {
                text: 'OK',
                onPress: () => {
                  if (onSuccess) onSuccess();
                  else onBack();
                },
              },
            ]
          );
        },
      },
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button First */}
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <BackChevronIcon />
          </TouchableOpacity>

          {/* Heading Next */}
          <Text style={styles.screenTitle}>Log New Expense</Text>
          <Text style={styles.screenSub}>{t('addExpenseLive.subtitle')}</Text>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Category Picker */}
            <Text style={styles.fieldLabel}>Expense Category</Text>
            <View style={styles.chipsWrap}>
              {categories.categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {categories.isLoading ? <Text style={styles.statusText}>{t('finance.addExpense.category.loading')}</Text> : null}
            {categories.error ? <Text style={styles.errorText}>{t(adminErrorKey(categories.error))}</Text> : null}

            {/* Warehouse Picker */}
            <Text style={styles.fieldLabel}>Warehouse / Facility</Text>
            <View style={styles.chipsWrap}>
              {warehouses.options.map((wh) => {
                const isActive = selectedWarehouse === wh.warehouseId;
                return (
                  <TouchableOpacity
                    key={wh.warehouseId}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedWarehouse(wh.warehouseId)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {wh.warehouseName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {warehouses.isLoading ? <Text style={styles.statusText}>{t('addExpenseLive.warehouses.loading')}</Text> : null}
            {warehouses.error ? <Text style={styles.errorText}>{t(adminErrorKey(warehouses.error))}</Text> : null}

            {/* Payment method: required by POST /admin/expenses (the design had no field for it). */}
            <Text style={styles.fieldLabel}>{t('finance.addExpense.section.paymentMethod')}</Text>
            <View style={styles.chipsWrap}>
              {EXPENSE_PAYMENT_METHODS.map((method) => {
                const isActive = paymentMethod === method;
                return (
                  <TouchableOpacity
                    key={method}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setPaymentMethod(method)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {expensePaymentMethodLabel(method)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount Input */}
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 4500"
                placeholderTextColor="#A8A29E"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Notes Input */}
            <Text style={styles.fieldLabel}>Notes / Vendor Reference</Text>
            <TextInput
              style={[styles.textInputArea]}
              placeholder="e.g. Invoiced by Nilgiri Electricals #INV-9921"
              placeholderTextColor="#A8A29E"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Submit Button */}
          {!allowed ? <Text style={styles.errorText}>{t('finance.notAvailable.message')}</Text> : null}
          {/* The real failure, worded by adminErrorKey; the success copy only ever follows a 2xx. */}
          {mutation.error ? (
            <Text style={styles.errorText} testID="addExpense.error">
              {t(adminErrorKey(mutation.error))}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[styles.submitBtn, (!allowed || submitting) && { opacity: 0.6 }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!allowed || submitting}
            testID="addExpense.submit"
            accessibilityRole="button"
            accessibilityState={{ disabled: !allowed || submitting }}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? t('addExpenseLive.submitting') : t('finance.addExpense.save')}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
    marginTop: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipActive: {
    backgroundColor: PALETTE.chipActiveBg,
    borderColor: PALETTE.orange,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  chipTextActive: {
    color: PALETTE.chipActiveText,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: PALETTE.pageBg,
    height: 48,
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  textInputArea: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: PALETTE.pageBg,
    fontSize: 13,
    color: PALETTE.ink,
    textAlignVertical: 'top',
    height: 80,
  },
  statusText: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.danger.text,
    lineHeight: 17,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
