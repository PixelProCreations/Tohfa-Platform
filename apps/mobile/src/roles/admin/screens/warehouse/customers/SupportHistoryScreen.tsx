/**
 * Support History: one customer's support tickets with search
 * (GET /admin/customers/{id}/support-tickets, newest first).
 *
 * Gates (FINAL_LIST row 19): read-only list (customer.support_history.view).
 * The ticket shape carries no farmer field and no customer contact (BR-97,
 * BR-92); the subject arrives already redacted for an `own` actor.
 *
 * Each row shows the ticket number, subject, category, created time and
 * status. The search box narrows the tickets already loaded by ticket number
 * or subject. "Load more" pages on.
 *
 * Hidden, because the API has no such figure or field: the Total / Open /
 * Resolved tiles (no ticket summary) and the order reference (a ticket carries
 * no order).
 */
// Design id: M7-S08
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { cardStyles, CustomersScreen, LinkButton, SearchField, StatusBadge } from './CustomersParts';
import type { CustomerRef, CustomersLiveStateProps, SupportTicketRow, WarehouseScreenBaseProps } from './types';

export interface SupportHistoryScreenProps extends WarehouseScreenBaseProps, CustomersLiveStateProps {
  customer?: CustomerRef | undefined;
  onSelectTicket?: ((ticket: SupportTicketRow) => void) | undefined;
  /** The loaded rows, page by page. */
  tickets?: readonly SupportTicketRow[] | undefined;
  /** The route carried no customer uuid: nothing can be looked up. */
  notFound?: boolean | undefined;
}

export function SupportHistoryScreen({
  onBack,
  customer,
  onSelectTicket,
  tickets = [],
  notFound = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: SupportHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const view = notFound ? 'notFound' : queryViewState({ isLoading, error, itemCount: tickets.length });
  const query = searchQuery.trim().toLowerCase();
  const rows =
    query === ''
      ? tickets
      : tickets.filter((ticket) => ticket.ticketNumber.toLowerCase().includes(query) || ticket.subject.toLowerCase().includes(query));

  return (
    <CustomersScreen title="Support History" subtitle={customer?.name} onBack={onBack} onRefresh={notFound ? undefined : onRefresh} isRefreshing={isRefreshing}>
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder={t('customers.support.searchPlaceholder')} />

      {view === 'loading' ? (
        <AdminLoadingState />
      ) : view === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : view === 'notFound' ? (
        <AdminEmptyState title={t('customers.empty.notFound')} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title={t(tickets.length === 0 ? 'customers.empty.tickets' : 'customers.empty.filtered')} />
      ) : (
        rows.map((ticket) => (
          <TouchableOpacity
            key={ticket.id}
            style={cardStyles.card}
            activeOpacity={0.85}
            onPress={() => onSelectTicket?.(ticket)}
            accessibilityRole="button"
          >
            <Text style={cardStyles.code}>{ticket.ticketNumber}</Text>
            <Text style={cardStyles.body}>
              {ticket.subject} · {ticket.categoryLabel}
            </Text>
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.meta}>{ticket.createdLabel}</Text>
              <StatusBadge label={ticket.statusLabel} tone={ticket.tone} />
            </View>
          </TouchableOpacity>
        ))
      )}
      {view === 'ready' && hasMore && onLoadMore ? <LinkButton label={t('customers.loadMore')} onPress={onLoadMore} /> : null}
    </CustomersScreen>
  );
}
