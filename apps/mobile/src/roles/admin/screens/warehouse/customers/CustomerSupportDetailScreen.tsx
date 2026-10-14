/**
 * Customer Support Detail: one support ticket and its thread
 * (GET /admin/customers/{id}/support-tickets/{ticketId}).
 *
 * Shows the ticket fields, its description and every message the server
 * returns, oldest first. For an `own` actor the server has already removed
 * internal notes that name a farmer and replaced farmer-identifying text with
 * `[redacted]` (BR-97); a redacted message and an internal note are marked as
 * such. Pull to refresh re-reads the thread.
 *
 * The screen has no reply control: the design has none. The reply write is
 * ready (useSupportReply in ./useCustomersData.ts, POST .../replies; it must
 * render only with can('support.ticket.respond') and only while the ticket is
 * not CLOSED, BR-97i), waiting for a design of the composer.
 *
 * Hidden, because the API has no such field: the order reference, the sample
 * activity timeline (the thread replaces it) and "Resolved By".
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { cardStyles, CustomersScreen, InfoGrid, SectionHeading } from './CustomersParts';
import type { CustomerRef, CustomersLiveStateProps, SupportTicketDetailView, SupportTicketRow, WarehouseScreenBaseProps } from './types';

export interface CustomerSupportDetailScreenProps extends WarehouseScreenBaseProps, CustomersLiveStateProps {
  customer?: CustomerRef | undefined;
  /** The list row that was opened: the header while the thread loads. */
  ticket?: SupportTicketRow | undefined;
  /** The ticket and its thread, once loaded. */
  detail?: SupportTicketDetailView | undefined;
  /** The route carried no customer or ticket uuid: nothing can be looked up. */
  notFound?: boolean | undefined;
}

export function CustomerSupportDetailScreen({
  onBack,
  customer,
  ticket,
  detail,
  notFound = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: CustomerSupportDetailScreenProps) {
  const noValue = t('customers.noValue');
  const customerName = customer?.name ?? noValue;

  if (notFound || detail === undefined) {
    const view = notFound ? 'empty' : queryViewState({ isLoading, error, itemCount: 0 });
    return (
      <CustomersScreen title="Support Detail" subtitle={ticket?.ticketNumber ?? customer?.name} onBack={onBack} onRefresh={notFound ? undefined : onRefresh} isRefreshing={isRefreshing}>
        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : (
          <AdminEmptyState title={t('customers.empty.notFound')} />
        )}
      </CustomersScreen>
    );
  }

  return (
    <CustomersScreen title="Support Detail" subtitle={customer?.name} onBack={onBack} onRefresh={onRefresh} isRefreshing={isRefreshing}>
      <InfoGrid
        rows={[
          [
            { label: 'Support ID', value: detail.ticketNumber },
            { label: 'Customer', value: customerName },
          ],
          [
            { label: t('customers.support.categoryLabel'), value: detail.categoryLabel },
            { label: 'Subject', value: detail.subject },
          ],
          [
            { label: 'Created', value: detail.createdLabel },
            { label: 'Status', value: detail.statusLabel },
          ],
          [{ label: t('customers.support.priorityLabel'), value: detail.priorityLabel }],
        ]}
      />

      <SectionHeading>Description</SectionHeading>
      <View style={cardStyles.card}>
        <Text style={cardStyles.body}>{detail.description === '' ? noValue : detail.description}</Text>
      </View>

      <SectionHeading>Activity</SectionHeading>
      {detail.messages.length === 0 ? (
        <AdminEmptyState title={t('customers.support.noMessages')} />
      ) : (
        detail.messages.map((message) => (
          <View key={message.id} style={cardStyles.card}>
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.title}>{message.senderLabel}</Text>
              <Text style={cardStyles.meta}>{message.atLabel}</Text>
            </View>
            <Text style={[cardStyles.body, styles.message]}>{message.body}</Text>
            {message.isInternal ? <Text style={cardStyles.meta}>{t('customers.support.internalNote')}</Text> : null}
            {message.redacted ? <Text style={cardStyles.meta}>{t('customers.support.redacted')}</Text> : null}
            {message.hasAttachment ? <Text style={cardStyles.meta}>{t('customers.support.attachment')}</Text> : null}
          </View>
        ))
      )}

      <SectionHeading>Resolution</SectionHeading>
      <InfoGrid
        rows={[
          [
            { label: 'Status', value: detail.statusLabel },
            { label: 'Resolved Date', value: detail.resolvedLabel ?? noValue },
          ],
        ]}
      />
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  message: { marginTop: adminSpacing.xs },
});
