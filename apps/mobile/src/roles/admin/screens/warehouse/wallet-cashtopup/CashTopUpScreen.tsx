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
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Svg, { Path, Rect } from 'react-native-svg';

import { CASH_TOPUP_CAP_PAISE, formatCashTopUpCap, validateTopUpAmount } from '../../../config/businessThresholds';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { useCustomerLookup } from './useWalletData';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import type { CashTopUpDraft, WalletCustomer, WarehouseScope, WarehouseScreenBaseProps } from './types';

const TOP_UP_PRESETS: readonly number[] = [500, 1000, 2000, 5000];
import {
  AmountRow,
  ArrowForwardIcon,
  Card,
  EmptyState,
  InfoCard,
  InfoNote,
  SearchBar,
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

function QrScanIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="8" y="8" width="3" height="3" fill={color} />
      <Rect x="13" y="8" width="3" height="3" fill={color} />
      <Rect x="8" y="13" width="3" height="3" fill={color} />
      <Rect x="13" y="13" width="3" height="3" fill={color} />
    </Svg>
  );
}

export interface CashTopUpScreenProps extends WarehouseScreenBaseProps {
  /** Customer being topped up (fallback customer when omitted). */
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
  warehouseOptions,
  onContinue,
}: CashTopUpScreenProps) {
  const { options: fetchedWarehouses } = useWarehouseOptions();
  const effectiveWarehouseOptions =
    warehouseOptions && warehouseOptions.length > 0 ? warehouseOptions : fetchedWarehouses;

  const [activeCustomer, setActiveCustomer] = useState<WalletCustomer | undefined>(customer);
  const { results: lookupResults, search: performLookup } = useCustomerLookup();

  useEffect(() => {
    if (customer) setActiveCustomer(customer);
  }, [customer]);

  useEffect(() => {
    if (lookupResults.length > 0) {
      setActiveCustomer(lookupResults[0]);
    }
  }, [lookupResults]);

  const custName = activeCustomer?.name ?? '';
  const custCode = activeCustomer?.customerId ?? activeCustomer?.id ?? '';
  const baseBalance = activeCustomer?.balance ? rupeesOf(activeCustomer.balance) : 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState<number>(2000);
  const [customInputVisible, setCustomInputVisible] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('2000');
  // Main picks the collecting warehouse; Sub is locked to its own.
  const [collectedAt, setCollectedAt] = useState<string | undefined>(
    scope.warehouseId ?? effectiveWarehouseOptions[0]?.warehouseId,
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    performLookup(text);
  };

  if (!can('wallet.cash_topup.process')) {
    // Hiding the flow is presentation only; the server re-checks the code.
    return (
      <WalletScreen title="Cash Top-Up" onBack={onBack}>
        <EmptyState title="Cash top-up is not available" subtitle="Your role does not include wallet cash top-ups." />
      </WalletScreen>
    );
  }

  const warehouseId = scope.warehouseId ?? collectedAt;
  const warehouseName =
    effectiveWarehouseOptions.find((w) => w.warehouseId === warehouseId)?.warehouseName ??
    scope.warehouseName ??
    warehouseId ??
    '';
  const processor = processedBy ?? (scope.warehouseName ?? (scope.warehouseId ? 'Sub Admin' : 'Main Admin'));
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
      customerId: activeCustomer?.customerId,
      currentBalancePaise: baseBalance * 100,
      topUpAmountPaise: amount * 100,
      warehouseId,
      warehouseName,
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
          {!isAllWarehouses(scope) ? (
            <SearchBar
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search Customer ID or mobile number"
              rightAction={
                <TouchableOpacity
                  onPress={() => Alert.alert('QR Scanner', 'Opening QR & Barcode scanner...')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <QrScanIcon size={20} color={adminColors.muted} />
                </TouchableOpacity>
              }
            />
          ) : (
            <Card>
              <Text style={styles.customerLine}>
                {custName} <Text style={styles.customerLineBold}>{custCode}</Text>
              </Text>
              <Text style={[styles.customerLine, styles.customerLineSpaced]}>
                Current Wallet Balance <Text style={styles.customerLineBold}>{formatRupees(baseBalance)}</Text>
              </Text>
            </Card>
          )}

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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.warehouseChipsRow}
              >
                {effectiveWarehouseOptions
                  .filter((w) => w.warehouseId !== undefined)
                  .map((w) => {
                    const active = (collectedAt ?? effectiveWarehouseOptions[0]?.warehouseId) === w.warehouseId;
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
                          {w.warehouseName ?? w.warehouseId}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
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
