/**
 * One expense as a tappable list row, shared by the expense list and the
 * voucher list (a voucher is derived from one expense, BR-75), plus the
 * status tone both use. Money is integer paise (root CLAUDE.md 2.2).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ExpenseStatus } from '../../../api/finance';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType, type AdminTone } from '../../../theme';
import { StatusBadge } from '../wallet-cashtopup/WalletParts';
import type { ExpenseRecord } from './types';

export const EXPENSE_STATUS_TONE: Readonly<Record<ExpenseStatus, AdminTone>> = {
  RECORDED: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export function ExpenseRow({
  expense,
  subtitle,
  onPress,
  accessibilityLabel,
}: {
  expense: ExpenseRecord;
  /** Second line (vendor / description, or a call to action). */
  subtitle: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const meta = [expense.dateLabel, expense.paymentMethodLabel].filter((part) => part !== '').join(' · ');
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.text}>
        <Text style={styles.title}>{expense.categoryName}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <View style={styles.side}>
        <Text style={styles.amount}>{formatPaise(expense.amountPaise)}</Text>
        <StatusBadge label={expense.statusLabel} tone={EXPENSE_STATUS_TONE[expense.status] ?? 'info'} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.md,
  },
  text: { flex: 1 },
  title: { ...adminType.rowTitle, color: adminColors.ink },
  subtitle: { ...adminType.body, color: adminColors.ink, marginTop: adminSpacing.xs },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  side: { alignItems: 'flex-end', gap: adminSpacing.xs },
  amount: { ...adminType.rowTitle, color: adminColors.ink },
});
