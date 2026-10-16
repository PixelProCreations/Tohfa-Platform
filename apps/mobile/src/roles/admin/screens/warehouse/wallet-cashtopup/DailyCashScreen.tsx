// Design id: M11-S08
/**
 * Daily Cash: today's cash figures for one warehouse and the end-of-day close
 * (BR-74). Reached from the finance hub/reports and the wallet daily summary.
 *
 * Live:
 *   GET  /admin/finance/daily-summary  (useDailyCashSummary)
 *   POST /admin/finance/cash-close     (useCreateCashCloseMutation, Idempotency-Key)
 * Both need finance.cash_close.manage; `can` only decides what to render, the
 * server re-checks the code and the warehouse scope (CLAUDE.md 2.1).
 *
 * Why the figures are never computed here: the expected closing is the
 * server's computation from the ledger (opening = the latest earlier close's
 * counted cash). The client only previews counted minus expected while typing;
 * the stored difference is the server's. No tolerance is applied to a
 * difference, so a short or over count is always submitted (BR-74c).
 *
 * Scope (BR-30): a Sub admin is pinned to its own warehouse; a Main admin is
 * not assigned to one, and the API requires it to name the warehouse, so the
 * screen waits for a pick.
 *
 * A day is closed once (BR-74d): when the summary already carries a close it
 * is shown read-only and no form is offered.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { useIdempotencyKey } from '../../../api/hooks';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { formatPaise } from '../../../money/paise';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import { FINANCE_CODES, FinanceNotAvailable, useFinanceWarehousePicker, type FinanceWarehousePicker } from '../finance-expenses/FinanceParts';
import {
  buildCashCloseBody,
  cashDifferencePaise,
  formatSignedPaise,
  istToday,
  mapCashClose,
  type CashCloseMapped,
  type DailyCashSummaryMapped,
} from '../finance-expenses/mappers';
import type { PermissionCheck, WarehouseScope, WarehouseTab } from '../finance-expenses/types';
import { useCreateCashCloseMutation, useDailyCashSummary } from '../finance-expenses/useFinanceData';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { AmountRow, Card, InfoNote, ScopeHeader, SectionTitle, StatusBadge, WalletButton, WalletScreen, walletLayout } from './WalletParts';

export interface DailyCashScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
}

export function DailyCashScreen({ scope, can, onBack }: DailyCashScreenProps) {
  const picker = useFinanceWarehousePicker(scope, can);
  if (!can(FINANCE_CODES.cashClose)) {
    return <FinanceNotAvailable title={t('dailyCash.notAvailableTitle')} message={t('finance.notAvailable.message')} onBack={onBack} />;
  }
  return (
    <WalletScreen title={t('dailyCash.title')} subtitle={formatAdminDay(istToday())} onBack={onBack} headerExtra={<DailyCashScopeHeader scope={scope} picker={picker} />}>
      <DailyCashWarehouseGate picker={picker}>
        {/* Keyed by warehouse so a new pick starts with an empty form and no stale result. */}
        <DailyCashBody key={picker.warehouseId} scope={scope} warehouseId={picker.warehouseId} />
      </DailyCashWarehouseGate>
    </WalletScreen>
  );
}

function DailyCashBody({ scope, warehouseId }: { scope: WarehouseScope; warehouseId: string | undefined }) {
  const date = istToday();
  const daily = useDailyCashSummary(warehouseId, date, true);
  const mutation = useCreateCashCloseMutation();
  const idem = useIdempotencyKey();
  const [countedText, setCountedText] = useState('');
  const [note, setNote] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [justClosed, setJustClosed] = useState<CashCloseMapped | undefined>(undefined);

  if (daily.isLoading) return <AdminLoadingState />;
  if (daily.error !== null && daily.error !== undefined && daily.summary === undefined) {
    return <AdminErrorState error={daily.error} onRetry={daily.refresh} />;
  }
  const summary = daily.summary;
  if (summary === undefined) return <AdminEmptyState title={t('async.empty.title')} />;

  const close = justClosed ?? summary.closed;
  const preview = cashDifferencePaise(countedText, summary.expectedClosingPaise);

  const submit = () => {
    const body = buildCashCloseBody({ date, countedText, note, warehouseId }, scope);
    if (body === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    mutation.mutate(
      { body, idempotencyKey: idem.keyFor(body) },
      {
        onSuccess: (result) => {
          idem.reset();
          setJustClosed(mapCashClose(result));
        },
        // A 409 means the day was closed elsewhere: refetch so the stored close shows.
        onError: () => daily.refresh(),
      },
    );
  };

  return (
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      <DailyCashFigures summary={summary} />

      <SectionTitle right={<StatusBadge label={close ? t('dailyCash.status.closed') : t('dailyCash.status.open')} tone={close ? 'success' : 'warning'} />}>
        {t('dailyCash.section.close')}
      </SectionTitle>
      {close ? (
        <CashCloseCard close={close} />
      ) : (
        <>
          <Card>
            <AmountRow label={t('dailyCash.expectedClosing')} value={formatPaise(summary.expectedClosingPaise)} />
            <Text style={styles.inputLabel}>{t('dailyCash.countLabel')}</Text>
            <TextInput
              style={styles.input}
              value={countedText}
              onChangeText={(text) => {
                setCountedText(text);
                setInvalid(false);
              }}
              keyboardType="decimal-pad"
              placeholder={t('dailyCash.countPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              accessibilityLabel={t('dailyCash.countLabel')}
              editable={!mutation.isPending}
            />
            {preview !== null ? (
              <AmountRow
                divider
                label={t('dailyCash.difference')}
                value={formatSignedPaise(preview)}
                emphasis={preview < 0 ? 'debit' : preview > 0 ? 'credit' : 'normal'}
              />
            ) : null}
          </Card>
          {invalid ? <Text style={styles.errorText}>{t('dailyCash.invalidCount')}</Text> : null}
          <InfoNote tone="info">{t('dailyCash.differenceHint')}</InfoNote>

          <Text style={styles.inputLabel}>{t('dailyCash.noteLabel')}</Text>
          <TextInput
            style={styles.textArea}
            value={note}
            onChangeText={setNote}
            placeholder={t('dailyCash.notePlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            accessibilityLabel={t('dailyCash.noteLabel')}
            multiline
            textAlignVertical="top"
            editable={!mutation.isPending}
          />
          {mutation.error ? <Text style={styles.errorText}>{t(adminErrorKey(mutation.error))}</Text> : null}
          <View style={styles.submitWrap}>
            <WalletButton
              label={mutation.isPending ? t('dailyCash.submitting') : t('dailyCash.submit')}
              onPress={submit}
              disabled={mutation.isPending || countedText.trim() === ''}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ─── Pieces shared with DailyCashSummaryScreen ───────────────────────────────

/** Sub: locked pill. Main: the live warehouse selector (FinanceParts picker). */
export function DailyCashScopeHeader({ scope, picker }: { scope: WarehouseScope; picker: FinanceWarehousePicker }) {
  return (
    <ScopeHeader
      scope={scope}
      warehouseOptions={picker.options}
      selectedWarehouseId={picker.selectedId}
      onSelectWarehouse={picker.isMain ? picker.setSelectedId : undefined}
    />
  );
}

/** Renders `children` only once there is a warehouse to read (a Main admin must pick one). */
export function DailyCashWarehouseGate({ picker, children }: { picker: FinanceWarehousePicker; children: React.ReactNode }) {
  if (picker.warehouseId !== undefined) return <>{children}</>;
  if (picker.isLoading) return <AdminLoadingState />;
  if (picker.error !== null && picker.error !== undefined) {
    return <AdminErrorState error={picker.error} message={t('finance.picker.loadError')} onRetry={picker.refresh} />;
  }
  return <AdminEmptyState title={t('finance.picker.pickWarehouse')} />;
}

/** The server's figures for the day, read-only (BR-74: never recomputed here). */
export function DailyCashFigures({ summary }: { summary: DailyCashSummaryMapped }) {
  return (
    <>
      <SectionTitle>{t('dailyCash.section.opening')}</SectionTitle>
      <Card>
        <AmountRow label={t('dailyCash.openingCash')} value={formatPaise(summary.openingCashPaise)} />
        <Text style={styles.meta}>
          {summary.openingFrom ? t('dailyCash.openingFrom', { date: formatAdminDay(summary.openingFrom) }) : t('dailyCash.openingNone')}
        </Text>
      </Card>

      <SectionTitle>{t('dailyCash.section.cashIn')}</SectionTitle>
      <Card>
        <AmountRow label={t('dailyCash.cashSales')} value={formatPaise(summary.cashSalesPaise)} />
        <AmountRow divider label={t('dailyCash.cashTopUps')} value={formatPaise(summary.cashTopUpsPaise)} />
      </Card>

      <SectionTitle>{t('dailyCash.section.cashOut')}</SectionTitle>
      <Card>
        <AmountRow label={t('dailyCash.cashExpenses')} value={formatPaise(summary.cashExpensesPaise)} />
      </Card>

      <SectionTitle>{t('dailyCash.section.closing')}</SectionTitle>
      <Card>
        <AmountRow label={t('dailyCash.expectedClosing')} value={formatPaise(summary.expectedClosingPaise)} emphasis="total" />
      </Card>
      <InfoNote tone="info">{t('dailyCash.serverNote')}</InfoNote>
    </>
  );
}

/** A stored close, exactly as the server recorded it (it can never be changed, BR-74i). */
export function CashCloseCard({ close }: { close: CashCloseMapped }) {
  const diff = close.differencePaise;
  return (
    <>
      <Card>
        <AmountRow label={t('dailyCash.expectedClosing')} value={formatPaise(close.expectedClosingPaise)} />
        <AmountRow divider label={t('dailyCash.counted')} value={formatPaise(close.countedCashPaise)} />
        <AmountRow
          divider
          label={t('dailyCash.difference')}
          value={formatSignedPaise(diff)}
          emphasis={diff < 0 ? 'debit' : diff > 0 ? 'credit' : 'normal'}
        />
        {close.note ? (
          <>
            <Text style={styles.inputLabel}>{t('dailyCash.note')}</Text>
            <Text style={styles.body}>{close.note}</Text>
          </>
        ) : null}
        {/* closedBy is a user uuid (CashClose has no name), so only the time is shown. */}
        <AmountRow divider label={t('dailyCash.closedAt')} value={formatAdminDate(close.createdAt, new Date())} />
      </Card>
      <InfoNote tone="success">{t('dailyCash.closedNote')}</InfoNote>
    </>
  );
}

const styles = StyleSheet.create({
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  body: { ...adminType.body, color: adminColors.ink, marginTop: adminSpacing.xs },
  inputLabel: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.md, marginBottom: adminSpacing.xs },
  input: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  textArea: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    minHeight: adminSpacing.page + adminSpacing.lg,
  },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.sm },
  submitWrap: { marginTop: adminSpacing.md },
});
