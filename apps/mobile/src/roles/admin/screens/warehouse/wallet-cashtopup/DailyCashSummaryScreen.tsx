// Design id: M8-S08
/**
 * Daily Cash Summary (wallet view): today's cash figures for one warehouse,
 * read-only, with the entry to the Daily Cash close (BR-74).
 *
 * Live: GET /admin/finance/daily-summary (useDailyCashSummary), gated on
 * finance.cash_close.manage; the server re-checks it and the warehouse scope
 * (CLAUDE.md 2.1). The figures are the server's `system` computation and are
 * never recomputed here.
 *
 * What is gone and why: the denomination breakdown, the per-top-up list and
 * the "Reconcile Cash" variance save were fixtures. There is no endpoint that
 * lists a day's cash top-up rows, and the only cash reconciliation the API
 * knows is the day close itself (POST /admin/finance/cash-close), which
 * DailyCashScreen performs.
 *
 * Scope (BR-30): Sub is pinned to its own warehouse; Main must pick one, since
 * the API requires a warehouse for an unassigned caller.
 */
import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';
import { FINANCE_CODES, FinanceNotAvailable, useFinanceWarehousePicker } from '../finance-expenses/FinanceParts';
import { istToday } from '../finance-expenses/mappers';
import type { PermissionCheck, WarehouseScope, WarehouseTab } from '../finance-expenses/types';
import { useDailyCashSummary } from '../finance-expenses/useFinanceData';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { CashCloseCard, DailyCashFigures, DailyCashScopeHeader, DailyCashWarehouseGate } from './DailyCashScreen';
import { SectionTitle, StatusBadge, WalletButton, WalletScreen, WarehouseTabBar, walletLayout } from './WalletParts';

export interface DailyCashSummaryScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Open the Daily Cash close (DailyCashScreen). */
  onNavigateToDailyCash: () => void;
}

export function DailyCashSummaryScreen({ scope, can, onBack, onTabChange, onNavigateToDailyCash }: DailyCashSummaryScreenProps) {
  const picker = useFinanceWarehousePicker(scope, can);
  if (!can(FINANCE_CODES.cashClose)) {
    return <FinanceNotAvailable title={t('dailyCash.summaryTitle')} message={t('finance.notAvailable.message')} onBack={onBack} />;
  }
  return (
    <WalletScreen
      title={t('dailyCash.summaryTitle')}
      subtitle={formatAdminDay(istToday())}
      onBack={onBack}
      headerExtra={<DailyCashScopeHeader scope={scope} picker={picker} />}
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      <DailyCashWarehouseGate picker={picker}>
        <SummaryBody warehouseId={picker.warehouseId} onNavigateToDailyCash={onNavigateToDailyCash} />
      </DailyCashWarehouseGate>
    </WalletScreen>
  );
}

function SummaryBody({ warehouseId, onNavigateToDailyCash }: { warehouseId: string | undefined; onNavigateToDailyCash: () => void }) {
  const daily = useDailyCashSummary(warehouseId, istToday(), true);
  if (daily.isLoading) return <AdminLoadingState />;
  const summary = daily.summary;
  if (summary === undefined) {
    if (daily.error !== null && daily.error !== undefined) {
      return <AdminErrorState error={daily.error} onRetry={daily.refresh} />;
    }
    return <AdminEmptyState title={t('async.empty.title')} />;
  }
  const close = summary.closed;
  return (
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      <DailyCashFigures summary={summary} />
      <SectionTitle
        right={
          <StatusBadge
            label={close ? t('dailyCash.status.closed') : t('dailyCash.status.open')}
            tone={close ? 'success' : 'warning'}
          />
        }
      >
        {t('dailyCash.section.close')}
      </SectionTitle>
      {close ? <CashCloseCard close={close} /> : null}
      <View style={styles.action}>
        <WalletButton
          label={close ? t('dailyCash.viewClose') : t('dailyCash.openClose')}
          onPress={onNavigateToDailyCash}
          variant={close ? 'outline' : 'primary'}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  action: { marginTop: adminSpacing.md },
});
