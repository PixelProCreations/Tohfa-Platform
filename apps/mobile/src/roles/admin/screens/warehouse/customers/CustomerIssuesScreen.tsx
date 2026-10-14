/**
 * Customer Issues: the issues one customer raised
 * (GET /admin/customers/{id}/issues; today every issue is a return request).
 *
 * Gates (FINAL_LIST row 12): a read-only list for customer.issues.view. For an
 * `own` actor the server returns only issues on orders at its warehouse.
 * Opening an issue shows its read-only detail.
 *
 * Each row shows the server's reference as sent (`RET-…`, a display label,
 * not a key: the row is keyed and opened by the return id, BR-91h), the order
 * number, the status and the reason. "Load more" pages on.
 *
 * Hidden, because the API has no such field or figure: the category tabs (an
 * issue carries a free-text reason, not a category) and the Open / In Review /
 * Resolved tiles (no issue summary; a count of the loaded pages would be
 * partial).
 */
// Design id: M7-S07
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { cardStyles, CustomersScreen, LinkButton, StatusBadge } from './CustomersParts';
import type { CustomerIssueRow, CustomerRef, CustomersLiveStateProps, WarehouseScreenBaseProps } from './types';

export interface CustomerIssuesScreenProps extends WarehouseScreenBaseProps, CustomersLiveStateProps {
  customer?: CustomerRef | undefined;
  onSelectIssue?: ((issue: CustomerIssueRow) => void) | undefined;
  /** The loaded rows, page by page. */
  issues?: readonly CustomerIssueRow[] | undefined;
  /** The route carried no customer uuid: nothing can be looked up. */
  notFound?: boolean | undefined;
}

export function CustomerIssuesScreen({
  onBack,
  customer,
  onSelectIssue,
  issues = [],
  notFound = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: CustomerIssuesScreenProps) {
  const view = notFound ? 'notFound' : queryViewState({ isLoading, error, itemCount: issues.length });

  return (
    <CustomersScreen title="Customer Issues" subtitle={customer?.name} onBack={onBack} onRefresh={notFound ? undefined : onRefresh} isRefreshing={isRefreshing}>
      {view === 'loading' ? (
        <AdminLoadingState />
      ) : view === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : view === 'notFound' ? (
        <AdminEmptyState title={t('customers.empty.notFound')} />
      ) : view === 'empty' ? (
        <AdminEmptyState title={t('customers.empty.issues')} />
      ) : (
        <>
          {issues.map((issue) => (
            <TouchableOpacity
              key={issue.id}
              style={cardStyles.card}
              activeOpacity={0.85}
              onPress={() => onSelectIssue?.(issue)}
              accessibilityRole="button"
            >
              <View style={cardStyles.rowBetween}>
                <Text style={cardStyles.code}>{issue.reference}</Text>
                <StatusBadge label={issue.statusLabel} tone={issue.tone} />
              </View>
              {issue.orderNumber !== null ? (
                <Text style={[cardStyles.meta, styles.order]}>{t('customers.issues.order', { number: issue.orderNumber })}</Text>
              ) : null}
              {issue.reason !== null ? <Text style={[cardStyles.body, styles.reason]}>{issue.reason}</Text> : null}
              <Text style={cardStyles.meta}>{issue.createdLabel}</Text>
            </TouchableOpacity>
          ))}
          {hasMore && onLoadMore ? <LinkButton label={t('customers.loadMore')} onPress={onLoadMore} /> : null}
        </>
      )}
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  order: { marginTop: adminSpacing.xs },
  reason: { marginTop: adminSpacing.xs },
});
