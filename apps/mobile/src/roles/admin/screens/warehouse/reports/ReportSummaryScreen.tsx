/**
 * Report Summary — KPI tiles plus a tappable record for an inline Returns or
 * Sales report. Tapping the record opens ReportDetailScreen for the same kind.
 *
 * Replaces the MainWarehouseReturnsReportScreen / MainWarehouseSalesReportScreen
 * twins; the difference (title and the four KPI tiles) is the `kind` prop plus
 * REPORT_COPY.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - None. There is no export/download control here (that would be
 *     `report.export.file`, which MAIN_WH_ADMIN holds only as `view`), and
 *     rbac.json has no report-view code (SPEC_GAPS.md W3b-1).
 */
import React, { useState } from 'react';
import { View, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing } from '../../../theme';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import { REPORT_COPY, SAMPLE_REPORT_RECORD } from './fixtures';
import { ReportDetailScreen } from './ReportDetailScreen';
import type { ReportKind, ReportKpi } from './types';

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

export interface ReportSummaryScreenProps extends WarehouseScreenBaseProps {
  kind: ReportKind;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

function KpiTile({ kpi }: { kpi: ReportKpi }) {
  return (
    <View style={styles.kpiBox}>
      <Text style={styles.kpiLabel}>{kpi.label}</Text>
      <Text style={styles.kpiValue}>{kpi.value}</Text>
    </View>
  );
}

export function ReportSummaryScreen({ kind, scope, can, onBack, onNavigate }: ReportSummaryScreenProps) {
  const [viewDetail, setViewDetail] = useState(false);
  const copy = REPORT_COPY[kind];
  const [k1, k2, k3, k4] = copy.kpis;

  if (viewDetail) {
    return (
      <ReportDetailScreen
        kind={kind}
        scope={scope}
        can={can}
        onBack={() => setViewDetail(false)}
        onNavigate={onNavigate}
        record={SAMPLE_REPORT_RECORD}
      />
    );
  }

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
        <View style={styles.kpiRow}>
          <KpiTile kpi={k1} />
          <KpiTile kpi={k2} />
        </View>
        <View style={styles.kpiRow}>
          <KpiTile kpi={k3} />
          <KpiTile kpi={k4} />
        </View>

        <TouchableOpacity style={styles.recordCard} activeOpacity={0.8} onPress={() => setViewDetail(true)}>
          <Text style={styles.recordId}>Record #{SAMPLE_REPORT_RECORD.id}</Text>
          <Text style={styles.recordSub}>Tap to view full detail</Text>
        </TouchableOpacity>
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
  kpiRow: { flexDirection: 'row', gap: adminSpacing.md, marginBottom: adminSpacing.md },
  kpiBox: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  kpiLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.sm },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  recordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.sm,
  },
  recordId: { ...adminType.sectionHead, color: adminColors.ink },
  recordSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
});
