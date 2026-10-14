// Design id: M8-S05
/**
 * Fiscal Cash Tag: step 2 of the cash top-up wizard. BR-18: a cash top-up
 * cannot complete without the physical fiscal cash tag, and the wallet credit
 * is made server-side with the tag, never by this screen.
 *
 * Live (plan phase 9): the tag is checked before it is sent: required, and
 * 3..60 characters once trimmed (docs/openapi.yaml
 * CashTopupCreate.fiscalCashTag; mappers.validateFiscalTag). The server checks
 * it again (422 FISCAL_TAG_REQUIRED) and refuses a tag already used (409).
 *
 * FINAL_LIST lists it under finance-expenses (#39), but it only ever opens
 * inside the wallet flow, so it lives in wallet-cashtopup.
 *
 * Gate: Review Top-Up only when can('wallet.cash_topup.fiscal_tag'); the
 * server enforces the code again.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { FISCAL_TAG_MAX_LENGTH, FISCAL_TAG_MIN_LENGTH, validateFiscalTag } from './mappers';
import type { CashTopUpDraft, WarehouseScreenBaseProps } from './types';
import {
  ArrowForwardIcon,
  InfoCard,
  PermissionNote,
  SectionHint,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from './WalletParts';

export interface FiscalTagScreenProps extends WarehouseScreenBaseProps {
  /** The top-up so far (customer, amount, warehouse). */
  draft: CashTopUpDraft;
  /** Continue to the confirm step with the tag attached. */
  onReviewTopUp: (draft: CashTopUpDraft) => void;
}

export function FiscalTagScreen({ can, onBack, draft, onReviewTopUp }: FiscalTagScreenProps) {
  const [tag, setTag] = useState<string>(draft.fiscalCashTag ?? '');
  const [showError, setShowError] = useState(false);
  const canTag = can('wallet.cash_topup.fiscal_tag');
  const check = validateFiscalTag(tag);
  const noValue = t('customers.noValue');
  const expectedNewBalance = draft.currentBalancePaise === null ? null : draft.currentBalancePaise + draft.amountPaise;

  const handleContinue = () => {
    if (!canTag) return;
    if (!check.ok) {
      setShowError(true);
      return;
    }
    onReviewTopUp({ ...draft, fiscalCashTag: check.tag });
  };

  return (
    <WalletScreen
      title={t('wallet.topup.fiscal.title')}
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label={t('wallet.topup.fiscal.review')} icon={<ArrowForwardIcon />} onPress={handleContinue} disabled={!canTag} />
          {canTag ? null : <PermissionNote>{t('wallet.topup.fiscal.permission')}</PermissionNote>}
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SectionTitle>{t('wallet.topup.fiscal.summary')}</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: t('wallet.topup.customer'), value: draft.customer.name },
              { label: t('wallet.topup.customerId'), value: draft.customer.code },
            ],
            [
              { label: t('wallet.topup.previewCurrent'), value: draft.currentBalancePaise === null ? noValue : formatPaise(draft.currentBalancePaise) },
              { label: t('wallet.topup.amount'), value: formatPaise(draft.amountPaise) },
            ],
            [{ label: t('wallet.topup.previewNew'), value: expectedNewBalance === null ? noValue : formatPaise(expectedNewBalance) }],
          ]}
        />

        <SectionTitle right={<SectionHint>{t('wallet.topup.fiscal.required')}</SectionHint>}>{t('wallet.topup.fiscal.title')}</SectionTitle>
        <TextInput
          style={[styles.tagInput, showError && !check.ok && styles.tagInputError]}
          value={tag}
          onChangeText={(text) => {
            setTag(text);
            setShowError(false);
          }}
          editable={canTag}
          placeholder={t('wallet.topup.fiscal.placeholder')}
          placeholderTextColor={adminColors.placeholder}
          autoCapitalize="characters"
          autoCorrect={false}
          accessibilityLabel={t('wallet.topup.fiscal.title')}
        />
        {showError && !check.ok ? (
          <Text style={styles.errorText}>{t(check.errorKey, { min: FISCAL_TAG_MIN_LENGTH, max: FISCAL_TAG_MAX_LENGTH })}</Text>
        ) : null}
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
});
