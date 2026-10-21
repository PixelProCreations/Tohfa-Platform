import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
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

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface AuditReportDetailsScreenProps {
  onBack: () => void;
  reportId?: string;
  onDownload?: () => void;
}

interface AuditRowItem {
  code: string;
  farmer: string;
  type: 'Internal' | 'External';
  date: string;
  status: 'Completed';
  score: string;
}

export function AuditReportDetailsScreen({
  onBack,
  reportId = 'audit_summary',
  onDownload,
}: AuditReportDetailsScreenProps) {
  // Summary key-value rows matching media_1792339703059.png
  const summaryRows = [
    { label: 'Applied filters', value: 'None' },
    { label: 'Audit count', value: '42' },
    { label: 'Completed audits', value: '32' },
    { label: 'Average score', value: '86.7 / 100' },
    { label: 'Lowest to highest', value: '81 to 91' },
    { label: 'Findings', value: '36 major, 25 minor' },
    { label: 'Missing audit coverage', value: '4 farmer-quarters' },
  ];

  // Missing coverage rows matching media_1792339703059.png
  const missingCoverageRows = [
    { name: 'Kumar', quarter: 'Q3 2026' },
    { name: 'Arun', quarter: 'Q2 2026' },
    { name: 'Vijay', quarter: 'Q1 2026' },
    { name: 'Sundar', quarter: 'Q3 2026' },
  ];

  // Table rows matching media_1792339718082.png
  const auditTableRows: AuditRowItem[] = [
    { code: 'AUD-2026-0001', farmer: 'Ramesh Kumar', type: 'External', date: '2026-01-18', status: 'Completed', score: '88' },
    { code: 'AUD-2026-0002', farmer: 'Ramesh Kumar', type: 'Internal', date: '2026-04-21', status: 'Completed', score: '87' },
    { code: 'AUD-2026-0003', farmer: 'Ramesh Kumar', type: 'External', date: '2026-07-24', status: 'Completed', score: '88' },
    { code: 'AUD-2026-0004', farmer: 'Selvi',        type: 'Internal', date: '2026-01-25', status: 'Completed', score: '90' },
    { code: 'AUD-2026-0005', farmer: 'Selvi',        type: 'External', date: '2026-04-28', status: 'Completed', score: '88' },
    { code: 'AUD-2026-0006', farmer: 'Selvi',        type: 'Internal', date: '2026-07-31', status: 'Completed', score: '91' },
    { code: 'AUD-2026-0007', farmer: 'Meena',        type: 'External', date: '2026-02-01', status: 'Completed', score: '81' },
    { code: 'AUD-2026-0008', farmer: 'Meena',        type: 'Internal', date: '2026-05-05', status: 'Completed', score: '82' },
  ];

  const handleDownloadPress = () => {
    if (onDownload) {
      onDownload();
    } else {
      Alert.alert(
        'Report Downloaded',
        'Audit Summary Report has been saved to your downloads folder.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner Matching media_1792339703059.png ── */}
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
            Report Details
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section Tag: A · Audit reports Matching media_1792339703059.png ── */}
        <Text style={styles.sectionHeading}>A · Audit reports</Text>

        {/* ── Card 1: Audit Summary Report Metadata ── */}
        <View style={styles.cardContainer}>
          <Text style={styles.reportMainTitle}>Audit Summary Report</Text>
          <Text style={styles.reportTimestamp}>Generated 14 Oct 2026, 10:00</Text>

          <View style={styles.dividerLine} />

          {summaryRows.map((item, idx) => (
            <View key={idx}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{item.label}</Text>
                <Text style={styles.metaValue}>{item.value}</Text>
              </View>
              {idx < summaryRows.length - 1 && <View style={styles.dashedDivider} />}
            </View>
          ))}
        </View>

        {/* ── Card 2: Missing Coverage Matching media_1792339703059.png ── */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardSectionTitle}>Missing coverage</Text>
          <View style={styles.dividerLine} />

          {missingCoverageRows.map((row, idx) => (
            <View key={idx}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{row.name}</Text>
                <Text style={styles.metaValue}>{row.quarter}</Text>
              </View>
              {idx < missingCoverageRows.length - 1 && <View style={styles.dashedDivider} />}
            </View>
          ))}
        </View>

        {/* ── Card 3: Compliance Information Box Matching media_1792339703059.png ── */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardSectionTitle}>Compliance information</Text>
          <View style={styles.warningInfoBox}>
            <Text style={styles.warningInfoText}>
              Compliance-tier configuration is missing. No tier is calculated or invented.
            </Text>
          </View>
        </View>

        {/* ── Card 4: Audit Table Matching media_1792339718082.png ── */}
        <View style={styles.cardContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableInnerWrapper}>
              {/* Table Column Headers */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: 105 }]}>Audit</Text>
                <Text style={[styles.tableHeaderCell, { width: 105 }]}>Farmer</Text>
                <Text style={[styles.tableHeaderCell, { width: 75 }]}>Type</Text>
                <Text style={[styles.tableHeaderCell, { width: 85 }]}>Date</Text>
                <Text style={[styles.tableHeaderCell, { width: 85 }]}>Status</Text>
                <Text style={[styles.tableHeaderCell, { width: 50, textAlign: 'right' }]}>Score</Text>
              </View>

              <View style={styles.dashedDivider} />

              {/* Table Body Rows */}
              {auditTableRows.map((r, idx) => (
                <View key={idx}>
                  <View style={styles.tableDataRow}>
                    <Text style={[styles.tableDataCellCode, { width: 105 }]}>{r.code}</Text>
                    <Text style={[styles.tableDataCell, { width: 105 }]} numberOfLines={1}>{r.farmer}</Text>
                    <Text style={[styles.tableDataCell, { width: 75 }]}>{r.type}</Text>
                    <Text style={[styles.tableDataCell, { width: 85 }]}>{r.date}</Text>
                    <Text style={[styles.tableDataCell, { width: 85 }]}>{r.status}</Text>
                    <Text style={[styles.tableDataCellScore, { width: 50, textAlign: 'right' }]}>{r.score}</Text>
                  </View>
                  {idx < auditTableRows.length - 1 && <View style={styles.dashedDivider} />}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer Caption */}
          <Text style={styles.tableFooterCaption}>Showing 8 of 42 rows.</Text>
        </View>

        {/* ── Bottom Download CTA Button Matching media_1792339718082.png ── */}
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownloadPress}
          activeOpacity={0.8}
        >
          <Text style={styles.downloadBtnText}>Download</Text>
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

  // Section Heading (media_1792339703059.png)
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },

  // Card Container
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  reportMainTitle: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  reportTimestamp: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  cardSectionTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  dividerLine: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.sm,
  },
  dashedDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.6,
  },

  // Key Value Rows
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
  },
  metaLabel: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.muted,
  },
  metaValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Warning / Missing Config Box
  warningInfoBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: 6,
  },
  warningInfoText: {
    ...adminType.caption,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Table Styles (media_1792339718082.png)
  tableInnerWrapper: {
    minWidth: 505,
    paddingVertical: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tableHeaderCell: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  tableDataCellCode: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.ink,
  },
  tableDataCell: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.ink,
  },
  tableDataCellScore: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.ink,
  },
  tableFooterCaption: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },

  // Download Button (media_1792339718082.png)
  downloadBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.xl,
  },
  downloadBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
