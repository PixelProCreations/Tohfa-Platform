// Design id: M8-S05
/**
 * Fiscal Cash Tag: step 2 of the cash top-up wizard. BR-18: a cash top-up
 * cannot complete without the physical fiscal cash tag, and the wallet credit
 * is triggered server-side by the tag, never by this screen.
 *
 * FINAL_LIST lists it under finance-expenses (#39), but it only ever opens
 * inside the wallet flow, so it lives in wallet-cashtopup.
 *
 * Gate: Confirm Tag ("Review Top-Up") only when can('wallet.cash_topup.fiscal_tag');
 * the server enforces the code again.
 *
 * Absorbs dashboard/MainWarehouseFiscalTagScreen: its inline "required" error,
 * the permission note and the one-tag-one-credit rule are shown for both roles.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { SAMPLE_FISCAL_TAG, SAMPLE_WALLET_CUSTOMER, sampleProcessedBy } from './fixtures';
import type { CashTopUpDraft, WarehouseScreenBaseProps } from './types';
import {
  ArrowForwardIcon,
  InfoCard,
  InfoNote,
  PermissionNote,
  SectionHint,
  SectionTitle,
  ShieldCheckIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
  formatRupees,
  walletLayout,
} from './WalletParts';

export interface FiscalTagScreenProps extends WarehouseScreenBaseProps {
  /** The top-up so far (demo values fill the gaps). */
  draft?: Partial<CashTopUpDraft> | undefined;
  /** Continue to the confirm step with the tag attached. */
  onReviewTopUp: (draft: CashTopUpDraft) => void;
}

export function FiscalTagScreen({ scope, can, onBack, draft = {}, onReviewTopUp }: FiscalTagScreenProps) {
  const customerName = draft.customerName ?? SAMPLE_WALLET_CUSTOMER.name;
  const customerCode = draft.customerCode ?? SAMPLE_WALLET_CUSTOMER.id;
  const currentBalance = draft.currentBalance ?? 4500;
  const topUpAmount = draft.topUpAmount ?? 2000;
  const expectedNewBalance = currentBalance + topUpAmount;

  const [tag, setTag] = useState<string>(draft.fiscalCashTag ?? SAMPLE_FISCAL_TAG);
  const [error, setError] = useState(false);
  const canTag = can('wallet.cash_topup.fiscal_tag');

  const handleSimulateDuplicate = () => {
    Alert.alert(
      'Duplicate Fiscal Tag Error (demo)',
      `Tag ${tag} was already recorded for another transaction today.\n\nTag must be unique per warehouse register.`,
    );
  };

  const handleContinue = () => {
    if (!canTag) return;
    if (!tag.trim()) {
      setError(true);
      return;
    }
    setError(false);
    onReviewTopUp({
      customerName,
      customerCode,
      currentBalance,
      topUpAmount,
      warehouseId: draft.warehouseId ?? scope.warehouseId,
      warehouseName: draft.warehouseName ?? scope.warehouseName ?? '',
      processedBy: draft.processedBy ?? sampleProcessedBy(scope),
      channel: 'Cash',
      fiscalCashTag: tag.trim(),
    });
  };

  return (
    <WalletScreen
      title="Fiscal Cash Tag"
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label="Review Top-Up" icon={<ArrowForwardIcon />} onPress={handleContinue} disabled={!canTag} />
          {canTag ? null : <PermissionNote>Recording a fiscal cash tag needs wallet.cash_topup.fiscal_tag.</PermissionNote>}
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Transaction Summary</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Customer', value: customerName },
              { label: 'Customer ID', value: customerCode },
            ],
            [
              { label: 'Current Balance', value: formatRupees(currentBalance) },
              { label: 'Top-Up Amount', value: formatRupees(topUpAmount) },
            ],
            [{ label: 'Expected New Balance', value: formatRupees(expectedNewBalance) }],
          ]}
        />

        <SectionTitle right={<SectionHint>Required</SectionHint>}>Fiscal Cash Tag</SectionTitle>
        <TextInput
          style={[styles.tagInput, error && styles.tagInputError]}
          value={tag}
          onChangeText={(text) => {
            setTag(text);
            if (error) setError(false);
          }}
          editable={canTag}
          placeholder={`e.g. ${SAMPLE_FISCAL_TAG}`}
          placeholderTextColor={adminColors.placeholder}
          autoCapitalize="characters"
        />
        {error ? <Text style={styles.errorText}>Fiscal cash tag is required.</Text> : null}

        <InfoNote tone="success" icon={<ShieldCheckIcon />}>
          Gated by permission: wallet.cash_topup.fiscal_tag — also enforced server-side.
        </InfoNote>
        <InfoNote tone="info">
          One physical fiscal cash tag cannot fund two wallet credits — a duplicate tag is rejected as a clear conflict.
        </InfoNote>

        <TouchableOpacity style={styles.demoButton} onPress={handleSimulateDuplicate} activeOpacity={0.75}>
          <Text style={styles.demoButtonText}>Simulate duplicate tag error (demo)</Text>
        </TouchableOpacity>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  tagInput: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  tagInputError: { borderColor: adminColors.danger.border },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
  demoButton: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    marginTop: adminSpacing.md,
  },
  demoButtonText: { ...adminType.rowTitle, color: adminColors.brandDeep },
});
