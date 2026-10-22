import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReportDocIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TractorFarmIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 18h-5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Path d="M18 5a1 1 0 0 0-1 1v5.573" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Path
        d="M3 4h8.129a1 1 0 0 1 .99.863L13 11.246"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 11V4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Path d="M7 15h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M8 10.1V4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="18" cy="18" r="2" stroke={color} strokeWidth="1.9" />
      <Circle cx="7" cy="15" r="5" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

function CalendarReportIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Path d="M8 14h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M12 14h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M16 14h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M8 18h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M12 18h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M16 18h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function ExclamationCircleIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.9" />
      <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkCircleIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.9" />
      <Path
        d="M8.5 12.5l2.5 2.5 4.5-5"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RosetteCheckIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ReportTypeOption {
  id: string;
  title: string;
  iconType: 'doc' | 'tractor' | 'calendar' | 'alert' | 'check' | 'rosette';
  filtersApplied: string;
  auditCount: string;
  scoreRange: string;
  findings: string;
}

export interface GenerateAuditReportScreenProps {
  onBack: () => void;
  onGenerateReport?: (reportId: string) => void;
  onConfigureReport?: (reportId: string) => void;
}

export function GenerateAuditReportScreen({
  onBack,
  onGenerateReport,
  onConfigureReport,
}: GenerateAuditReportScreenProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>('audit_summary');

  const reportOptions: ReportTypeOption[] = [
    {
      id: 'audit_summary',
      title: 'Audit Summary',
      iconType: 'doc',
      filtersApplied: 'This quarter · All zones',
      auditCount: '12',
      scoreRange: '82 / 57 / 96',
      findings: '3 / 9',
    },
    {
      id: 'farmer_history',
      title: 'Farmer Audit History',
      iconType: 'tractor',
      filtersApplied: 'All time · All farmers',
      auditCount: '32',
      scoreRange: '79 / 50 / 98',
      findings: '7 / 14',
    },
    {
      id: 'quarterly_coverage',
      title: 'Quarterly Coverage',
      iconType: 'calendar',
      filtersApplied: 'Q4 2026 · Coonoor & Kotagiri',
      auditCount: '18',
      scoreRange: '85 / 62 / 94',
      findings: '2 / 5',
    },
    {
      id: 'findings_violations',
      title: 'Findings & Violations',
      iconType: 'alert',
      filtersApplied: 'Active findings · High priority',
      auditCount: '9',
      scoreRange: '64 / 45 / 80',
      findings: '5 / 11',
    },
    {
      id: 'corrective_action',
      title: 'Corrective Action',
      iconType: 'check',
      filtersApplied: 'Pending verification · All zones',
      auditCount: '17',
      scoreRange: '74 / 52 / 91',
      findings: '4 / 8',
    },
    {
      id: 'compliance_summary',
      title: 'Compliance Summary',
      iconType: 'rosette',
      filtersApplied: 'Current cycle · Zone A & B',
      auditCount: '24',
      scoreRange: '88 / 65 / 100',
      findings: '1 / 6',
    },
  ];

  const defaultReport: ReportTypeOption = reportOptions[0]!;
  const activeReport: ReportTypeOption = reportOptions.find((r) => r.id === selectedReportId) ?? defaultReport;

  const renderIcon = (type: ReportTypeOption['iconType']) => {
    switch (type) {
      case 'doc':
        return <ReportDocIcon />;
      case 'tractor':
        return <TractorFarmIcon />;
      case 'calendar':
        return <CalendarReportIcon />;
      case 'alert':
        return <ExclamationCircleIcon />;
      case 'check':
        return <CheckmarkCircleIcon />;
      case 'rosette':
        return <RosetteCheckIcon />;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 1 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Generate Audit Report
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Reports Heading ── */}
        <Text style={styles.sectionHeading}>Reports</Text>

        {/* ── 2-Column Grid of 6 Report Cards Matching Image 1 ── */}
        <View style={styles.reportsGrid}>
          {reportOptions.map((opt) => {
            const isSelected = selectedReportId === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.reportCard, isSelected && styles.reportCardSelected]}
                onPress={() => setSelectedReportId(opt.id)}
                activeOpacity={0.75}
              >
                <View style={styles.reportIconBox}>
                  {renderIcon(opt.iconType)}
                </View>
                <Text style={styles.reportCardTitle} numberOfLines={2}>
                  {opt.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Preview Card Matching Image 1 ── */}
        <View style={styles.previewCard}>
          <Text style={styles.previewCardTitle}>
            {activeReport.title} · preview
          </Text>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Filters applied</Text>
            <Text style={styles.tableValue}>{activeReport.filtersApplied}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Audit count</Text>
            <Text style={styles.tableValue}>{activeReport.auditCount}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Score (avg / low / high)</Text>
            <Text style={styles.tableValue}>{activeReport.scoreRange}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Findings (major / minor)</Text>
            <Text style={styles.tableValue}>{activeReport.findings}</Text>
          </View>
        </View>

        {/* ── Generate Report Button Matching Image 1 ── */}
        <TouchableOpacity
          style={styles.generateReportBtn}
          onPress={() => {
            if (onConfigureReport) onConfigureReport(selectedReportId);
            else if (onGenerateReport) onGenerateReport(selectedReportId);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.generateReportBtnText}>Generate Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },

  // 2x3 Grid
  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  reportCard: {
    width: '48.3%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    minHeight: 88,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  reportCardSelected: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
  },
  reportIconBox: {
    marginBottom: 8,
  },
  reportCardTitle: {
    ...adminType.rowTitle,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.ink,
    lineHeight: 16,
  },

  // Preview Card
  previewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  previewCardTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  tableLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  tableValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.5,
  },

  // Action Button
  generateReportBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateReportBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
