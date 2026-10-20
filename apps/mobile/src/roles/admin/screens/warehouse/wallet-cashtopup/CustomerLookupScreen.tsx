// Design id: M8-S02 (Find Customer, live)
/**
 * Find Customer: the wallet flow's counter lookup, before a cash top-up and
 * for the Customer Wallet. Live only: GET
 * /admin/wallets/cash-topup/customers/lookup (lookupCashTopupCustomer), an
 * exact mobile number or customer code (BR-91i; there is no name or partial
 * search), the mobile masked as the server sent it (BR-92g).
 *
 * Gate: wallet.cash_topup.process, the lookup's own code, which the Main and
 * the Sub Warehouse Admin both hold. (The customers area's Customer Search
 * gates on sales.sale.create, which MAIN_WH_ADMIN does not hold, so it cannot
 * serve the Main top-up.) Hiding is presentation only; the server re-checks.
 *
 * Nothing on this screen is a sample: idle prompt, loading, error with retry,
 * no match, or the server's matches. Every decision is in ./mappers.ts
 * (customerLookupQuery, customerLookupView).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { CASH_LOOKUP_NO_MATCH_KEY, type LookupView, type TopUpCustomer } from './mappers';
import type { WarehouseScreenBaseProps } from './types';
import { Card, EmptyState, SearchBar, SectionTitle, WalletScreen, walletLayout } from './WalletParts';

export interface CustomerLookupScreenProps extends WarehouseScreenBaseProps {
  query: string;
  onQueryChange: (text: string) => void;
  customers: readonly TopUpCustomer[];
  view: LookupView;
  error: unknown;
  onRetry: () => void;
  onSelect: (customer: TopUpCustomer) => void;
}

export function CustomerLookupScreen({
  can,
  onBack,
  query,
  onQueryChange,
  customers,
  view,
  error,
  onRetry,
  onSelect,
}: CustomerLookupScreenProps) {
  if (!can('wallet.cash_topup.process')) {
    return (
      <WalletScreen title={t('wallet.lookup.title')} onBack={onBack}>
        <EmptyState title={t('wallet.lookup.notAvailable')} />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen title={t('wallet.lookup.title')} onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <SearchBar value={query} onChangeText={onQueryChange} placeholder={t('wallet.lookup.cashPlaceholder')} />

        {view === 'idle' ? <Text style={styles.prompt}>{t('wallet.lookup.cashPrompt')}</Text> : null}
        {view === 'loading' ? <AdminLoadingState /> : null}
        {view === 'error' ? <AdminErrorState error={error} onRetry={onRetry} /> : null}
        {view === 'noMatch' ? <AdminEmptyState title={t(CASH_LOOKUP_NO_MATCH_KEY)} /> : null}
        {view === 'ready' ? (
          <>
            <SectionTitle>{t('wallet.lookup.results')}</SectionTitle>
            <Card>
              {customers.map((customer, index) => (
                <React.Fragment key={customer.customerUuid}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => onSelect(customer)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={customer.name}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.name}>{customer.name}</Text>
                      <Text style={styles.meta}>
                        {customer.code} · {customer.mobileMasked}
                      </Text>
                    </View>
                    {customer.balancePaise === null ? null : (
                      <View style={styles.balancePill} accessibilityLabel={t('wallet.lookup.walletBalance')}>
                        <Text style={styles.balanceText}>{formatPaise(customer.balancePaise)}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  prompt: { ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.md, textAlign: 'center' },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md, paddingVertical: adminSpacing.sm },
  rowText: { flex: 1 },
  name: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  balancePill: {
    backgroundColor: adminColors.brandSoft.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  balanceText: { ...adminType.caption, color: adminColors.brandSoft.text },
});
