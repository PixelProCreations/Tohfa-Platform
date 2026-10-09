// Design id: M8-S04
/**
 * Cash Top-Up: amount entry for a customer's wallet, step 1 of the cash
 * top-up wizard (-> Fiscal Cash Tag -> Confirm). Shared by Main and Sub.
 *
 * Gate: the whole flow is hidden unless can('wallet.cash_topup.process')
 * (FINAL_LIST #147). The warehouse the cash is collected at is the admin's own
 * warehouse when scope.warehouseId is set; Main (all warehouses) picks it.
 *
 * BR-19: the per-transaction cap comes from config/businessThresholds (which
 * mirrors system_config.cash_topup_cap), never a literal here. This is UX only;
 * the server enforces the cap and returns CASH_LIMIT_EXCEEDED.
 *
 * Absorbs dashboard/MainWarehouseCashTopUpScreen (its "Maximum cash top-up"
 * hint is shown here for both roles).
 */
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CASH_TOPUP_CAP_PAISE, formatCashTopUpCap, validateTopUpAmount } from '../../../config/businessThresholds';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { WarehouseSelector } from '../inventory';
import { SAMPLE_WALLET_CUSTOMER, TOP_UP_PRESETS, WALLET_WAREHOUSES, sampleProcessedBy, warehouseNameOf } from './fixtures';
import type { CashTopUpDraft, WalletCustomer, WarehouseScope, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  ArrowForwardIcon,
  Card,
  EmptyState,
  InfoCard,
  InfoNote,
  SectionHint,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  formatRupees,
  isAllWarehouses,
  rupeesOf,
  walletLayout,
} from './WalletParts';

export interface CashTopUpScreenProps extends WarehouseScreenBaseProps {
  /** Customer being topped up (demo customer when omitted). */
  customer?: WalletCustomer | undefined;
  /** Display name of the admin processing the top-up. */
  processedBy?: string | undefined;
  /** Warehouses Main may collect at (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Continue to the fiscal cash tag step. */
  onContinue: (draft: CashTopUpDraft) => void;
}

export function CashTopUpScreen({
  scope,
  can,
  onBack,
  customer,
  processedBy,
  warehouseOptions = WALLET_WAREHOUSES,
  onContinue,
}: CashTopUpScreenProps) {
  const custName = customer?.name ?? SAMPLE_WALLET_CUSTOMER.name;
  const custCode = customer?.id ?? SAMPLE_WALLET_CUSTOMER.id;
  const baseBalance = rupeesOf(customer?.balance ?? SAMPLE_WALLET_CUSTOMER.balance);

  const [amount, setAmount] = useState<number>(2000);
  const [customInputVisible, setCustomInputVisible] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('2000');
  // Main picks the collecting warehouse; Sub is locked to its own.
  const [collectedAt, setCollectedAt] = useState<string | undefined>(
    scope.warehouseId ?? warehouseOptions[0]?.warehouseId,
  );

  if (!can('wallet.cash_topup.process')) {
    // Hiding the flow is presentation only; the server re-checks the code.
    return (
      <WalletScreen title="Cash Top-Up" onBack={onBack}>
        <EmptyState title="Cash top-up is not available" subtitle="Your role does not include wallet cash top-ups." />
      </WalletScreen>
    );
  }

  const warehouseId = scope.warehouseId ?? collectedAt;
  const warehouseName = isAllWarehouses(scope) ? warehouseNameOf(warehouseId) : (scope.warehouseName ?? '');
  const processor = processedBy ?? sampleProcessedBy(scope);
  const newBalance = baseBalance + (amount || 0);

  const handleSelectPreset = (value: number) => {
    setAmount(value);
    setCustomInputValue(value.toString());
    setCustomInputVisible(false);
  };

  const handleCustomInput = (text: string) => {
    setCustomInputValue(text);
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) setAmount(parsed);
    else if (text === '') setAmount(0);
  };

  const handleProceed = () => {
    // `amount` is whole rupees (the input strips non-digits), so * 100 is exact
    // integer paise. The cap is BR-19's, from the config module, never a literal.
    const check = validateTopUpAmount(amount * 100, CASH_TOPUP_CAP_PAISE);
    if (!check.ok && check.reason === 'INVALID_AMOUNT') {
      Alert.alert('Invalid Amount', 'Please enter a valid cash top-up amount.');
      return;
    }
    if (!check.ok) {
      Alert.alert('Amount Limit', `A single cash top-up cannot exceed ${formatCashTopUpCap()}.`);
      return;
    }
    onContinue({
      customerName: custName,
      customerCode: custCode,
      currentBalance: baseBalance,
      topUpAmount: amount,
      warehouseId,
      warehouseName,
      processedBy: processor,
      channel: 'Cash',
    });
  };

  return (
    <WalletScreen
      title="Cash Top-Up"
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton
            label="Continue"
            icon={<ArrowForwardIcon />}
            onPress={handleProceed}
            disabled={!amount || amount <= 0}
          />
        </WalletFooter>
      }
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <Card>
            <Text style={styles.customerLine}>
              {custName} <Text style={styles.customerLineBold}>{custCode}</Text>
            </Text>
            <Text style={[styles.customerLine, styles.customerLineSpaced]}>
              Current Wallet Balance <Text style={styles.customerLineBold}>{formatRupees(baseBalance)}</Text>
            </Text>
          </Card>

          <SectionTitle>Cash Amount</SectionTitle>
          <View style={styles.amountCard}>
            <Text style={styles.currencySymbol}>₹</Text>
            {customInputVisible ? (
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={customInputValue}
                onChangeText={handleCustomInput}
                autoFocus
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={adminColors.placeholder}
              />
            ) : (
              <TouchableOpacity onPress={() => setCustomInputVisible(true)} activeOpacity={0.8}>
                <Text style={styles.amountText}>{amount ? amount.toString() : '0'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <SectionTitle right={<SectionHint>Config-driven</SectionHint>}>Preset Amounts</SectionTitle>
          <View style={styles.presetGrid}>
            {TOP_UP_PRESETS.map((preset) => {
              const selected = amount === preset && !customInputVisible;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetButton, selected && styles.presetButtonActive]}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.presetText, selected && styles.presetTextActive]}>{formatRupees(preset)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.customButton, customInputVisible && styles.customButtonActive]}
            onPress={() => setCustomInputVisible(true)}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Text style={styles.customButtonText}>Custom</Text>
          </TouchableOpacity>

          {/* Main twin's hint; the cap is BR-19's, from businessThresholds. */}
          <InfoNote tone="brandSoft">Maximum cash top-up: {formatCashTopUpCap()} per transaction</InfoNote>

          <SectionTitle>Balance Preview</SectionTitle>
          <Card>
            <AmountRow label="Current Balance" value={formatRupees(baseBalance)} />
            <AmountRow divider label="Cash Top-Up" value={`+${formatRupees(amount)}`} emphasis="credit" />
            <AmountRow divider label="New Balance" value={formatRupees(newBalance)} emphasis="total" />
          </Card>

          {isAllWarehouses(scope) ? (
            <>
              <SectionTitle>Collected At</SectionTitle>
              <View style={styles.selectorWrap}>
                <WarehouseSelector
                  scope={scope}
                  options={warehouseOptions}
                  selectedId={collectedAt}
                  onSelect={(id) => {
                    // A top-up is collected at one warehouse; "All" is not a choice here.
                    if (id !== undefined) setCollectedAt(id);
                  }}
                />
              </View>
            </>
          ) : null}

          <SectionTitle>Transaction Information</SectionTitle>
          <InfoCard
            rows={[
              [
                { label: 'Warehouse', value: warehouseName },
                { label: 'Processed By', value: processor },
              ],
              [{ label: 'Channel', value: 'Cash' }],
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
  currencySymbol: { ...adminType.sectionHead, color: adminColors.muted, marginBottom: 2 },
  // Was a 38px figure; the admin scale tops out at kpiValue (19).
  amountText: { ...adminType.kpiValue, color: adminColors.ink },
  amountInput: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    textAlign: 'center',
    minWidth: AMOUNT_INPUT_MIN_WIDTH,
    paddingVertical: 0,
  },
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
  customButton: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
  },
  customButtonActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  customButtonText: { ...adminType.rowTitle, color: adminColors.ink },
  // WarehouseSelector chips are drawn for the orange header; give them a brand backdrop here.
  selectorWrap: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
});
