/**
 * Report Detail — one record of an inline Returns or Sales report, read-only.
 *
 * Replaces the MainWarehouseReturnReportDetailScreen /
 * MainWarehouseSalesReportDetailScreen twins; the difference (header title) is
 * the `kind` prop plus REPORT_COPY.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - None. The screen has no export/download control (that would be
 *     `report.export.file`), and rbac.json has no report-view code
 *     (SPEC_GAPS.md W3b-1), so it renders ungated.
 */
import React from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing } from '../../../theme';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import { REPORT_COPY, SAMPLE_REPORT_RECORD } from './fixtures';
import type { ReportKind, ReportRecord } from './types';

function ArrowBackIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12H4M10 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface ReportDetailScreenProps extends WarehouseScreenBaseProps {
  kind: ReportKind;
  /** The record to show. Defaults to the mock sample record. */
  record?: ReportRecord | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

export function ReportDetailScreen({ kind, scope, onBack, record = SAMPLE_REPORT_RECORD }: ReportDetailScreenProps) {
  const copy = REPORT_COPY[kind];
  // No hard-coded warehouse: the record's own warehouse, else the viewer's
  // scope; Main (no warehouseId) sees "All warehouses".
  const warehouseLabel = record.warehouseName ?? scope.warehouseName ?? 'All warehouses';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={HIT_SLOP}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{copy.title}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Record</Text>
              <Text style={styles.value}>#{record.id}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Warehouse</Text>
              <Text style={styles.value}>{warehouseLabel}</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <View style={styles.col}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{record.dateText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Deep-links to the owning module for the actual record — never a duplicate workflow.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: adminSpacing.md },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  row: { flexDirection: 'row', marginBottom: adminSpacing.lg },
  rowLast: { marginBottom: 0 },
  col: { flex: 1 },
  label: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs },
  value: { ...adminType.sectionHead, color: adminColors.ink },
  infoBox: {
    backgroundColor: adminColors.canvas,
    padding: adminSpacing.lg,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  infoText: { ...adminType.body, color: adminColors.ink },
});
