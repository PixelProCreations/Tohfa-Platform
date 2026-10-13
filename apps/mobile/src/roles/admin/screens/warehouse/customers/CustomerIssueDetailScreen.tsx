/**
 * Customer Issue Detail: read-only view of one customer issue (a return
 * request), from the row the issues list loaded (the customers API has no
 * issue-detail route; GET /admin/returns/{id} is the returns area's, plan
 * phase 10).
 *
 * Shows what the server sent: the reference as given (a label, BR-91h), the
 * order number, status, reason, the refund value once an inspection recorded
 * accepted goods (absent before; it is the value of the accepted goods, not
 * proof a refund was paid), and the created and resolved times.
 *
 * Hidden: the evidence placeholder and the sample progress timeline (the API
 * has neither), and "View Issue / RMA" (gated on rma.request.process), which
 * opened a sample RMA record; it comes back when the returns screens read the
 * return by this issue's id (plan phase 10).
 */
import React from 'react';
import { Text, View } from 'react-native';

import { t } from '../../../i18n';
import { AdminEmptyState } from '../shared/AsyncStates';
import { cardStyles, CustomersScreen, InfoGrid, SectionHeading, type InfoField } from './CustomersParts';
import type { CustomerIssueRow, CustomerRef, WarehouseScreenBaseProps } from './types';

export interface CustomerIssueDetailScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  issue?: CustomerIssueRow | undefined;
}

export function CustomerIssueDetailScreen({ onBack, customer, issue }: CustomerIssueDetailScreenProps) {
  const noValue = t('customers.noValue');

  if (issue === undefined) {
    return (
      <CustomersScreen title="Issue Detail" subtitle={customer?.name} onBack={onBack}>
        <AdminEmptyState title={t('customers.empty.notFound')} />
      </CustomersScreen>
    );
  }

  const rows: InfoField[][] = [
    [
      { label: 'Issue ID', value: issue.reference },
      { label: 'Order', value: issue.orderNumber ?? noValue },
    ],
    [
      { label: 'Customer', value: customer?.name ?? noValue },
      { label: t('customers.issues.status'), value: issue.statusLabel },
    ],
    [
      { label: 'Created', value: issue.createdLabel },
      { label: t('customers.issues.resolved'), value: issue.resolvedLabel ?? noValue },
    ],
  ];
  if (issue.refundLabel !== null) rows.push([{ label: t('customers.issues.acceptedValue'), value: issue.refundLabel }]);

  return (
    <CustomersScreen title="Issue Detail" subtitle={customer?.name} onBack={onBack}>
      <InfoGrid rows={rows} />

      <SectionHeading>Description</SectionHeading>
      <View style={cardStyles.card}>
        <Text style={cardStyles.body}>{issue.reason ?? noValue}</Text>
      </View>
    </CustomersScreen>
  );
}
