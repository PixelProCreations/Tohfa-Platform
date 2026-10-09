/**
 * Customer Support Detail: read-only view of one support ticket (fields,
 * activity timeline, resolution).
 *
 * Gates (FINAL_LIST row 15): read-only, because support.ticket.view_all is
 * `view` for both warehouse roles. The screen has no respond/resolve control;
 * if one is added it must render only with can('support.ticket.respond').
 */
import React from 'react';

import { CustomersScreen, InfoGrid, SectionHeading, Timeline } from './CustomersParts';
import { DEFAULT_CUSTOMER, INITIAL_SUPPORT_TICKETS } from './fixtures';
import type { CustomerRef, SupportTicketRecord, Loose, WarehouseScreenBaseProps } from './types';

export interface CustomerSupportDetailScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  ticket?: Loose<SupportTicketRecord> | undefined;
}

const ACTIVITY = [
  { title: 'Customer message', completed: true },
  { title: 'Admin response', completed: true },
  { title: 'Support action', completed: true },
  { title: 'Resolution', completed: true },
] as const;

export function CustomerSupportDetailScreen({ onBack, customer, ticket }: CustomerSupportDetailScreenProps) {
  const fallback = INITIAL_SUPPORT_TICKETS[0] as SupportTicketRecord;
  const known = Object.fromEntries(Object.entries(ticket ?? {}).filter(([, value]) => value !== undefined));
  const current: SupportTicketRecord = { ...fallback, ...known };
  const customerName = customer?.name ?? DEFAULT_CUSTOMER.name;

  return (
    <CustomersScreen title="Support Detail" subtitle={customerName} onBack={onBack}>
      <InfoGrid
        rows={[
          [
            { label: 'Support ID', value: current.ticketNo },
            { label: 'Customer', value: customerName },
          ],
          [
            { label: 'Order', value: current.orderRef },
            { label: 'Subject', value: current.subject },
          ],
          [
            { label: 'Created', value: current.dateText },
            { label: 'Status', value: current.status },
          ],
        ]}
      />

      <SectionHeading>Activity</SectionHeading>
      <Timeline steps={ACTIVITY} />

      <SectionHeading>Resolution</SectionHeading>
      <InfoGrid
        rows={[
          [
            { label: 'Status', value: current.status },
            { label: 'Resolved Date', value: current.dateText },
          ],
          [{ label: 'Resolved By', value: current.resolvedBy ?? '-' }],
        ]}
      />
    </CustomersScreen>
  );
}
