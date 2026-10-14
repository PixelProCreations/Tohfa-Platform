// Design id: M8-S04
/**
 * Cash Top-Up: amount entry for a customer's wallet, step 1 of the cash
 * top-up wizard (-> Fiscal Cash Tag -> Confirm). Shared by Main and Sub.
 *
 * Live (plan phase 9): the customer is a live one (uuid, code, masked mobile,
 * BR-92), picked from Customer Details or the counter lookup; the flow never
 * opens this screen without one. The amount is typed rupees turned into
 * integer paise at once (mappers.parseTopUpAmount, never a float).
 *
 * Gate: the whole flow is hidden unless can('wallet.cash_topup.process')
 * (FINAL_LIST #147); the server checks the code again.
 *
 * BR-19: the per-transaction cap comes from config/businessThresholds (which
 * mirrors system_config.cash_topup_cap), never a literal here. UX only; the
 * server enforces the cap and returns CASH_LIMIT_EXCEEDED.
 *
 * BR-30: a Sub scope collects at its own warehouse. The all-warehouses (Main)
 * scope picks one, and only a warehouse uuid can be sent: with no uuid option
 * (the Main hosts still pass sample codes) Continue stays off and says why.
 * The current balance is the live wallet read, for the preview only; the
 * new balance shown after the top-up is the server's.
 */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fromPaise, type Paise } from '@tohfa/shared-types';

import { formatCashTopUpCap } from '../../../config/businessThresholds';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { uuidParam } from '../customers/mappers';
import { TOP_UP_PRESETS_PAISE, parseTopUpAmount, topUpWarehouseId, type TopUpCustomer } from './mappers';
import type { CashTopUpDraft, WarehouseScope, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  ArrowForwardIcon,
  Card,
  EmptyState,
  InfoCard,
  InfoNote,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  isAllWarehouses,
  walletLayout,
} from './WalletParts';

export interface CashTopUpScreenProps extends WarehouseScreenBaseProps {
  /** The live customer being topped up. */
  customer: TopUpCustomer;
  /** The wallet balance before the top-up (live read); null while unknown. */
  currentBalancePaise: Paise | null;
  /** The draft this step produced before (back from Fiscal Tag): its amount and warehouse are kept. */
  draft?: CashTopUpDraft | undefined;
  /** Warehouses Main may collect at (ignored for a Sub scope); only uuids can be sent. */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Continue to the fiscal cash tag step. */
  onContinue: (draft: CashTopUpDraft) => void;
}

/** Whole-rupee text for an amount the screen fills in (presets, a kept draft). */
function rupeesText(paise: Paise): string {
  return fromPaise(paise).replace(/\.00$/, '');
}

export function CashTopUpScreen({
  scope,
  can,
  onBack,
  customer,
  currentBalancePaise,
  draft,
  warehouseOptions = [],
  onContinue,
}: CashTopUpScreenProps) {
  const uuidOptions = warehouseOptions.filter((w) => uuidParam(w.warehouseId) !== undefined);
  const [amountText, setAmountText] = useState(draft === undefined ? '' : rupeesText(draft.amountPaise));
  const [showError, setShowError] = useState(false);
  // Main picks the collecting warehouse; Sub is locked to its own.
  const [collectedAt, setCollectedAt] = useState<string | undefined>(draft?.warehouseId ?? uuidOptions[0]?.warehouseId);

  if (!can('wallet.cash_topup.process')) {
    // Hiding the flow is presentation only; the server re-checks the code.
    return (
      <WalletScreen title={t('wallet.topup.title')} onBack={onBack}>
        <EmptyState title={t('wallet.topup.notAvailable.title')} subtitle={t('wallet.topup.notAvailable.subtitle')} />
      </WalletScreen>
    );
  }

  const noValue = t('customers.noValue');
  const amount = parseTopUpAmount(amountText);
  const amountPaise = amount.ok ? amount.paise : null;
  const warehouseId = topUpWarehouseId(scope, collectedAt);
  const warehouseName = isAllWarehouses(scope)
    ? (uuidOptions.find((w) => w.warehouseId === warehouseId)?.warehouseName ?? noValue)
    : (scope.warehouseName ?? scope.warehouseCode ?? noValue);
  const newBalance = amountPaise !== null && currentBalancePaise !== null ? currentBalancePaise + amountPaise : null;
  const errorText = amount.ok ? null : t(amount.errorKey, { cap: formatCashTopUpCap() });

  const handleProceed = () => {
    if (!amount.ok || warehouseId === null) {
      setShowError(true);
      return;
    }
    onContinue({
      customer,
      amountPaise: amount.paise,
      warehouseId,
      warehouseName,
      currentBalancePaise,
      fiscalCashTag: draft?.fiscalCashTag,
    });
  };

  return (
    <WalletScreen
      title={t('wallet.topup.title')}
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton
            label={t('wallet.topup.continue')}
            icon={<ArrowForwardIcon />}
            onPress={handleProceed}
            disabled={amountText.trim() === '' || warehouseId === null}
          />
        </WalletFooter>
      }
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={styles.customerLine}>
              {customer.name} <Text style={styles.customerLineBold}>{customer.code}</Text>
            </Text>
            <Text style={styles.customerMeta}>{customer.mobileMasked}</Text>
            <Text style={[styles.customerLine, styles.customerLineSpaced]}>
              {t('wallet.topup.currentBalance')}{' '}
              <Text style={styles.customerLineBold}>{currentBalancePaise === null ? noValue : formatPaise(currentBalancePaise)}</Text>
            </Text>
          </Card>

          <SectionTitle>{t('wallet.topup.cashAmount')}</SectionTitle>
          <View style={[styles.amountCard, showError && errorText !== null && styles.amountCardError]}>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={amountText}
              onChangeText={(text) => {
                setAmountText(text);
                setShowError(false);
              }}
              placeholder={rupeesText(0)}
              placeholderTextColor={adminColors.placeholder}
              accessibilityLabel={t('wallet.topup.cashAmount')}
            />
          </View>
          {showError && errorText !== null ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <SectionTitle>{t('wallet.topup.presets')}</SectionTitle>
          <View style={styles.presetGrid}>
            {TOP_UP_PRESETS_PAISE.map((preset) => {
              const selected = amountPaise === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetButton, selected && styles.presetButtonActive]}
                  onPress={() => {
                    setAmountText(rupeesText(preset));
                    setShowError(false);
                  }}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.presetText, selected && styles.presetTextActive]}>{formatPaise(preset)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* The cap is BR-19's, from businessThresholds. */}
          <InfoNote tone="brandSoft">{t('wallet.topup.capNote', { cap: formatCashTopUpCap() })}</InfoNote>

          <SectionTitle>{t('wallet.topup.balancePreview')}</SectionTitle>
          <Card>
            <AmountRow label={t('wallet.topup.previewCurrent')} value={currentBalancePaise === null ? noValue : formatPaise(currentBalancePaise)} />
            <AmountRow
              divider
              label={t('wallet.topup.previewTopUp')}
              value={amountPaise === null ? noValue : `+${formatPaise(amountPaise)}`}
              emphasis="credit"
            />
            <AmountRow divider label={t('wallet.topup.previewNew')} value={newBalance === null ? noValue : formatPaise(newBalance)} emphasis="total" />
          </Card>

          {isAllWarehouses(scope) ? (
            <>
              <SectionTitle>{t('wallet.topup.collectedAt')}</SectionTitle>
              {uuidOptions.length === 0 ? (
                <InfoNote tone="warning">{t('wallet.topup.noWarehouse')}</InfoNote>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.warehouseChipsRow}>
                  {uuidOptions.map((w) => {
                    const active = warehouseId === w.warehouseId;
                    return (
                      <TouchableOpacity
                        key={w.warehouseId}
                        style={[styles.warehouseChip, active && styles.warehouseChipActive]}
                        onPress={() => setCollectedAt(w.warehouseId)}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.warehouseChipText, active && styles.warehouseChipTextActive]}>
                          {w.warehouseName ?? w.warehouseCode ?? w.warehouseId}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </>
          ) : null}

          <SectionTitle>{t('wallet.topup.transactionInfo')}</SectionTitle>
          <InfoCard
            rows={[
              [
                { label: t('wallet.topup.warehouse'), value: warehouseName },
                { label: t('wallet.topup.channel'), value: t('wallet.topup.channelCash') },
              ],
            ]}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </WalletScreen>
  );
}

const AMOUNT_INPUT_MIN_WIDTH = 160;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  customerLine: { ...adminType.body, color: adminColors.ink },
  customerLineBold: { ...adminType.rowTitle, color: adminColors.ink },
  customerMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  customerLineSpaced: { marginTop: adminSpacing.sm },
  amountCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.xl,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  amountCardError: { borderColor: adminColors.danger.border },
  // Was a 38px figure; the admin scale tops out at kpiValue (19).
  amountInput: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    textAlign: 'center',
    minWidth: AMOUNT_INPUT_MIN_WIDTH,
    paddingVertical: 0,
  },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
  presetGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: adminSpacing.sm, marginBottom: adminSpacing.sm },
  presetButton: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  presetButtonActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  presetText: { ...adminType.rowTitle, color: adminColors.ink },
  presetTextActive: { color: adminColors.onBrand },
  warehouseChipsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  warehouseChip: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  warehouseChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  warehouseChipText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  warehouseChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});
