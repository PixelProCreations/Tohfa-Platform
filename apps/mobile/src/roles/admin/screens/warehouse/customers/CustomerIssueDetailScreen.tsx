/**
 * Customer Issue Detail: read-only view of one customer issue (fields,
 * description, evidence placeholder, progress timeline).
 *
 * Gates (FINAL_LIST row 11): the 'View Issue / RMA' button, which opens the
 * returns (RMA) flow, renders only with can('rma.request.process').
 * Without a handler it is hidden too (the old Alert placeholder is gone).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing } from '../../../theme';
import { cardStyles, CustomersScreen, InfoGrid, PrimaryButton, SectionHeading, Timeline } from './CustomersParts';
import { DEFAULT_CUSTOMER, INITIAL_CUSTOMER_ISSUES } from './fixtures';
import type { CustomerIssueRecord, CustomerRef, Loose, WarehouseScreenBaseProps } from './types';

export interface CustomerIssueDetailScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  issue?: Loose<CustomerIssueRecord> | undefined;
  /** Opens the RMA for this issue; rendered only with can('rma.request.process'). */
  onViewRma?: ((issue: CustomerIssueRecord) => void) | undefined;
}

const TIMELINE = [
  { title: 'Issue Reported', completed: true },
  { title: 'Issue Received', completed: true },
  { title: 'Inspection', completed: true },
  { title: 'Review', completed: true },
  { title: 'Resolution', completed: false },
] as const;

function ImageIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21"
        stroke={adminColors.brandDeep}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RmaIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15h6"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CustomerIssueDetailScreen({ can, onBack, customer, issue, onViewRma }: CustomerIssueDetailScreenProps) {
  const fallback = INITIAL_CUSTOMER_ISSUES[0] as CustomerIssueRecord;
  const known = Object.fromEntries(Object.entries(issue ?? {}).filter(([, value]) => value !== undefined));
  const current: CustomerIssueRecord = { ...fallback, ...known };
  const customerName = customer?.name ?? DEFAULT_CUSTOMER.name;

  return (
    <CustomersScreen title="Issue Detail" subtitle={customerName} onBack={onBack}>
      <InfoGrid
        rows={[
          [
            { label: 'Issue ID', value: current.issueNo },
            { label: 'Order', value: current.orderNo },
          ],
          [
            { label: 'Customer', value: customerName },
            { label: 'Category', value: current.category },
          ],
          [
            { label: 'Product', value: current.product ?? '-' },
            { label: 'Quantity', value: current.quantity ?? '-' },
          ],
          [{ label: 'Created', value: current.dateText }],
        ]}
      />

      <SectionHeading>Description</SectionHeading>
      <View style={cardStyles.card}>
        <Text style={cardStyles.body}>{current.description ?? '-'}</Text>
      </View>

      <SectionHeading>Evidence</SectionHeading>
      <View style={styles.evidence}>
        <ImageIcon />
      </View>

      <SectionHeading>Timeline</SectionHeading>
      <Timeline steps={TIMELINE} />

      {onViewRma && can('rma.request.process') ? (
        <PrimaryButton label="View Issue / RMA" icon={<RmaIcon />} onPress={() => onViewRma(current)} />
      ) : null}
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  evidence: {
    width: 72,
    height: 72,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
});
