/**
 * Building blocks shared by the warehouse Home screens (dashboard-home-more),
 * on the admin theme. The frame, cards, chips and buttons come from
 * wallet-cashtopup/WalletParts like the other warehouse areas; this file adds
 * the permission codes the Home screens check, a label/value row card and a
 * section title with a "View All" link.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, type AdminTone } from '../../../theme';

/** docs/rbac.json codes the Home screens check (grants per FINAL_LIST 20-29). */
export const HOME_CODES = {
  /** Multi-warehouse Home, Quick Actions, Stock & Transfer. MAIN all, SUB none. */
  allView: 'warehouse.all.view',
  /** Transfer Stock / Initiate Stock Transfer. MAIN all, SUB none. */
  transferInitiate: 'transfer.inter_warehouse.initiate',
  /** Create SWA. MAIN all, SUB none. */
  swaCreate: 'admin.sub_wh_admin.create',
  /** Warehouse Targets (Warehouse Settings). MAIN all, SUB none. */
  capacitySet: 'warehouse.capacity.set',
  /** Order cards and order rows. MAIN all, SUB own. */
  orderList: 'order.list.view_all',
  /** Inventory snapshot / stock sections. MAIN all, SUB own. */
  batchView: 'inventory.batch.view',
  /** Today's sales summary. MAIN all, SUB own. */
  salesIncome: 'finance.sales_income.view',
  /** Approve & Issue Invoice. MAIN all, SUB all. */
  invoiceGenerate: 'invoice.generate',
  /** GST / tax details. No warehouse role holds it (SA/TA only). */
  gstGenerate: 'invoice.gst.generate',
} as const;

export interface DataRow {
  label: string;
  value: string;
  tone?: AdminTone | undefined;
}

/** Card of label / value rows with hairline dividers and an optional emphasised total row. */
export function DataRowCard({ rows, total }: { rows: readonly DataRow[]; total?: DataRow | undefined }) {
  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <React.Fragment key={row.label}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.dataRow}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={[styles.rowValue, row.tone !== undefined && { color: adminColors[row.tone].text }]}>{row.value}</Text>
          </View>
        </React.Fragment>
      ))}
      {total !== undefined ? (
        <>
          <View style={styles.totalDivider} />
          <View style={styles.dataRow}>
            <Text style={styles.totalLabel}>{total.label}</Text>
            <Text style={styles.totalLabel}>{total.value}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

/** Section heading with an optional "View All" link on the right. */
export function SectionLink({
  title,
  linkLabel = 'View All',
  onPress,
}: {
  title: string;
  linkLabel?: string | undefined;
  onPress?: (() => void) | undefined;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress !== undefined ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${title}: ${linkLabel}`}>
          <Text style={styles.link}>{linkLabel} →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Pressable white card holding one line of muted text (summary cards). */
export function SummaryCard({ text, onPress }: { text: string; onPress?: (() => void) | undefined }) {
  return (
    <TouchableOpacity style={styles.summaryCard} onPress={onPress} disabled={onPress === undefined} activeOpacity={0.8}>
      <Text style={styles.summaryText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    ...adminShadow.sm,
  },
  dataRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: adminSpacing.md },
  rowLabel: { ...adminType.body, color: adminColors.ink },
  rowValue: { ...adminType.rowTitle, color: adminColors.ink },
  divider: { height: 1, backgroundColor: adminColors.border },
  totalDivider: { height: 1.5, backgroundColor: adminColors.border },
  totalLabel: { ...adminType.sectionHead, color: adminColors.ink },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
  link: { ...adminType.rowTitle, color: adminColors.brand },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  summaryText: { ...adminType.body, color: adminColors.muted },
});
