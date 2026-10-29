/**
 * Support History: one customer's support tickets with search.
 *
 * Gates (FINAL_LIST row 19): read-only (support.ticket.view_all is `view` for
 * both warehouse roles). There is no reply/respond control on this screen;
 * if one is added it must render only with can('support.ticket.respond').
 *
 * Absorbs Main SupportHistoryScreen (pair M7-S08: "SW 344 vs MWA 226"): same
 * three tiles and ticket card; nothing Main-only remained.
 */
// Design id: M7-S08
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { cardStyles, CustomersScreen, EmptyState, SearchField, StatTiles, StatusBadge } from './CustomersParts';
import type { CustomerRef, SupportTicketRecord, WarehouseScreenBaseProps } from './types';

export interface SupportHistoryScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  onSelectTicket?: ((ticket: SupportTicketRecord) => void) | undefined;
  tickets?: readonly SupportTicketRecord[] | undefined;
}

export function SupportHistoryScreen({
  onBack,
  customer,
  onSelectTicket,
  tickets = [],
}: SupportHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const customerName = customer?.name ?? '—';

  const total = tickets.length;
  const open = tickets.filter((t) => t.status === 'Open').length;
  const resolved = tickets.filter((t) => t.status === 'Resolved').length;
  const supportKpis = [
    { label: 'TOTAL TICKETS', value: String(total) },
    { label: 'OPEN', value: String(open) },
    { label: 'RESOLVED', value: String(resolved) },
  ];

  const query = searchQuery.trim().toLowerCase();
  const rows = tickets.filter(
    (t) =>
      !query ||
      t.ticketNo.toLowerCase().includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      t.orderRef.toLowerCase().includes(query),
  );

  return (
    <CustomersScreen title="Support History" subtitle={customerName} onBack={onBack}>
      <StatTiles items={supportKpis} />
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Search ticket ID, subject or order" />

      {rows.length === 0 ? (
        <EmptyState title="No support tickets found" />
      ) : (
        rows.map((ticket) => (
          <TouchableOpacity
            key={ticket.id}
            style={cardStyles.card}
            activeOpacity={0.85}
            onPress={() => onSelectTicket?.(ticket)}
            accessibilityRole="button"
          >
            <Text style={cardStyles.code}>{ticket.ticketNo}</Text>
            <Text style={cardStyles.body}>
              {ticket.subject} · Order {ticket.orderRef}
            </Text>
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.meta}>{ticket.dateText}</Text>
              <StatusBadge label={ticket.status} tone={ticket.status === 'Resolved' ? 'success' : 'info'} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </CustomersScreen>
  );
}
