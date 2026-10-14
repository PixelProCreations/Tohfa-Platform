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
 * has neither).
 *
 * "View Return" opens the live return by this issue's id (an issue IS a
 * return request, so its id is the return uuid; plan phase 10). The host
 * passes onOpenReturn only when the caller holds rma.request.process, so the
 * button is absent without it; the server re-checks (CLAUDE.md 2.1).
 */
import React from 'react';
import { Text, View } from 'react-native';

import { t } from '../../../i18n';
import { AdminEmptyState } from '../shared/AsyncStates';
import { cardStyles, CustomersScreen, InfoGrid, PrimaryButton, SectionHeading, type InfoField } from './CustomersParts';
import type { CustomerIssueRow, CustomerRef, WarehouseScreenBaseProps } from './types';

export interface CustomerIssueDetailScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  issue?: CustomerIssueRow | undefined;
  /** Open the live return of this issue; undefined hides the button (no rma.request.process). */
  onOpenReturn?: (() => void) | undefined;
}

export function CustomerIssueDetailScreen({ onBack, customer, issue, onOpenReturn }: CustomerIssueDetailScreenProps) {
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

      {onOpenReturn ? <PrimaryButton label={t('customers.issues.openReturn')} onPress={onOpenReturn} /> : null}
    </CustomersScreen>
  );
}
