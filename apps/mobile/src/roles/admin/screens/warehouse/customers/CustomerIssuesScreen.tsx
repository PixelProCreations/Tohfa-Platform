/**
 * Customer Issues: one customer's issues with category tabs.
 *
 * Gates (FINAL_LIST row 12): a read-only list for customer.list.view. Opening
 * an issue shows its read-only detail; the only control that opens or
 * processes the RMA ("View Issue / RMA" on the detail) renders only with
 * can('rma.request.process').
 *
 * Absorbs Main CustomerIssuesScreen (pair M7-S07: "SW category tabs vs MWA
 * 238-line static"): the Main card's product line is shown on every row that
 * carries one.
 */
// Design id: M7-S07
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminSpacing } from '../../../theme';
import { cardStyles, ChipRow, CustomersScreen, EmptyState, StatTiles, StatusBadge } from './CustomersParts';
import { CUSTOMER_ISSUE_KPIS, DEFAULT_CUSTOMER, INITIAL_CUSTOMER_ISSUES } from './fixtures';
import type { CustomerIssueRecord, CustomerRef, WarehouseScreenBaseProps } from './types';

export interface CustomerIssuesScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  onSelectIssue?: ((issue: CustomerIssueRecord) => void) | undefined;
  issues?: readonly CustomerIssueRecord[] | undefined;
}

const CATEGORY_TABS = ['All', 'Quality', 'Quantity', 'Missing', 'Wrong', 'Damaged', 'Late'] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

export function CustomerIssuesScreen({
  onBack,
  customer,
  onSelectIssue,
  issues = INITIAL_CUSTOMER_ISSUES,
}: CustomerIssuesScreenProps) {
  const [category, setCategory] = useState<CategoryTab>('All');
  const customerName = customer?.name ?? DEFAULT_CUSTOMER.name;
  const rows = issues.filter((issue) => category === 'All' || issue.category.toLowerCase() === category.toLowerCase());

  return (
    <CustomersScreen title="Customer Issues" subtitle={customerName} onBack={onBack}>
      <StatTiles items={CUSTOMER_ISSUE_KPIS} />
      <ChipRow options={CATEGORY_TABS} selected={category} onSelect={setCategory} />

      {rows.length === 0 ? (
        <EmptyState title="No issues in this category" />
      ) : (
        rows.map((issue) => (
          <TouchableOpacity
            key={issue.id}
            style={cardStyles.card}
            activeOpacity={0.85}
            onPress={() => onSelectIssue?.(issue)}
            accessibilityRole="button"
          >
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.code}>{issue.issueNo}</Text>
              <StatusBadge
                label={issue.status}
                tone={issue.status === 'Resolved' ? 'success' : issue.status === 'Open' ? 'info' : 'warning'}
              />
            </View>
            <View style={styles.tagRow}>
              <StatusBadge label={issue.category} tone="brandSoft" />
              <Text style={cardStyles.meta}>· Order {issue.orderNo}</Text>
            </View>
            {issue.product ? <Text style={[cardStyles.body, styles.product]}>{issue.product}</Text> : null}
            <Text style={cardStyles.meta}>{issue.dateText}</Text>
          </TouchableOpacity>
        ))
      )}
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginTop: adminSpacing.xs },
  product: { marginTop: adminSpacing.xs },
});
