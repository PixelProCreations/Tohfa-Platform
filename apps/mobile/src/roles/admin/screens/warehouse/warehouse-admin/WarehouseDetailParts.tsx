/**
 * Cards of the Main admin's Warehouse Detail (design M15-03) that the shared
 * WalletParts / WarehouseAdminParts do not have: the "detail lives in another
 * module" link card, the SWA person card, the one-document card and a dated
 * timeline row. Display only; every word arrives translated from the caller
 * and every colour, size and spacing is an admin theme token.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, type AdminTone } from '../../../theme';
import { StatusBadge } from '../wallet-cashtopup/WalletParts';
import { DocumentIcon, UserIcon } from './WarehouseAdminParts';

/** A line saying where the detail lives, and the action that opens it there. */
export function DetailLinkCard({ text, actionLabel, onPress }: { text: string; actionLabel: string; onPress: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.meta}>{text}</Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={actionLabel}>
        <Text style={styles.action}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

/** One Sub Warehouse Admin: name, then "Admin ID: … · status" in the status tone. */
export function SwaPersonCard({ name, meta, tone }: { name: string; meta: string; tone: AdminTone }) {
  return (
    <View style={[styles.card, styles.row]}>
      <View style={styles.iconBox}>
        <UserIcon size={20} />
      </View>
      <View style={styles.grow}>
        <Text style={styles.title}>{name}</Text>
        <Text style={[styles.meta, { color: adminColors[tone].text }]}>{meta}</Text>
      </View>
    </View>
  );
}

/** One warehouse document, view-only: title, type / number line, server status and dates. */
export function DocumentSummaryCard({
  title,
  subtitle,
  statusLabel,
  statusTone,
  dateLine,
}: {
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: AdminTone;
  dateLine: string;
}) {
  return (
    <View style={[styles.card, styles.row]}>
      <View style={styles.iconBox}>
        <DocumentIcon />
      </View>
      <View style={styles.grow}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, styles.grow]}>{title}</Text>
          <StatusBadge label={statusLabel} tone={statusTone} />
        </View>
        <Text style={styles.meta}>{subtitle}</Text>
        <Text style={styles.meta}>{dateLine}</Text>
      </View>
    </View>
  );
}

/** A dated line outside the activity feed (e.g. "SWA assigned — name"). */
export function TimelineRow({ title, when }: { title: string; when: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>{when}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  grow: { flex: 1 },
  iconBox: {
    width: adminSpacing.xxl + adminSpacing.sm,
    height: adminSpacing.xxl + adminSpacing.sm,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
  action: { ...adminType.rowTitle, color: adminColors.brand },
});
