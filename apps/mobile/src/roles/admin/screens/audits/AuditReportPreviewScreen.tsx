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
import Svg, { Circle, Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { AdminConfirmDialog } from '../../components/AdminConfirmDialog';

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

function DownloadIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertTriangleIcon({ size = 18, color = '#B45309' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleSmallIcon({ size = 14, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface AuditReportPreviewScreenProps {
  onBack: () => void;
  reportTitle?: string;
  onDownload?: () => void;
}

interface AuditTableRow {
  id: string;
  farmer: string;
  type: 'Internal' | 'External';
  date: string;
  status: 'Completed';
  score: number;
}

const SAMPLE_AUDIT_ROWS: AuditTableRow[] = [
  { id: 'AUD-2026-0001', farmer: 'Ramesh Kumar', type: 'External', date: '2026-01-18', status: 'Completed', score: 88 },
  { id: 'AUD-2026-0002', farmer: 'Ramesh Kumar', type: 'Internal', date: '2026-04-21', status: 'Completed', score: 87 },
  { id: 'AUD-2026-0003', farmer: 'Ramesh Kumar', type: 'External', date: '2026-07-24', status: 'Completed', score: 88 },
  { id: 'AUD-2026-0004', farmer: 'Selvi', type: 'Internal', date: '2026-01-25', status: 'Completed', score: 90 },
  { id: 'AUD-2026-0005', farmer: 'Selvi', type: 'External', date: '2026-04-28', status: 'Completed', score: 88 },
  { id: 'AUD-2026-0006', farmer: 'Selvi', type: 'Internal', date: '2026-07-31', status: 'Completed', score: 91 },
  { id: 'AUD-2026-0007', farmer: 'Meena', type: 'External', date: '2026-02-01', status: 'Completed', score: 81 },
  { id: 'AUD-2026-0008', farmer: 'Meena', type: 'Internal', date: '2026-05-05', status: 'Completed', score: 82 },
];

const MISSING_COVERAGE_ROWS = [
  { name: 'Kumar', id: 'FMR-00101', zone: 'Ooty · Zone B', quarter: 'Q3 2026' },
  { name: 'Arun', id: 'FMR-00105', zone: 'Coonoor · Zone A', quarter: 'Q2 2026' },
  { name: 'Vijay', id: 'FMR-00152', zone: 'Kotagiri · Zone C', quarter: 'Q1 2026' },
  { name: 'Sundar', id: 'FMR-00188', zone: 'Gudalur · Zone D', quarter: 'Q3 2026' },
];

/**
 * AuditReportPreviewScreen
 *
 * Implements M5-S06b · Report Preview / Report Details matching exact UI
 * with enhanced admin theme typography, cards, and spacing.
 */
export function AuditReportPreviewScreen({
  onBack,
  reportTitle = 'Farmer Audit History',
  onDownload,
}: AuditReportPreviewScreenProps): React.JSX.Element {
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);

  const handleDownloadPress = () => {
    if (onDownload) {
      onDownload();
    } else {
      setDownloadModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Header Banner ─── */}
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
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Report Details
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Audit Reports · Historical Analysis
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Card 1: Report Overview & Metrics ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderTop}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.cardHeaderTitle}>{reportTitle}</Text>
              <Text style={styles.cardHeaderSubtitle}>Generated 14 Oct 2026, 10:00</Text>
            </View>
            <View style={styles.statusPill}>
              <CheckCircleSmallIcon />
              <Text style={styles.statusPillText}>Ready</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Applied filters</Text>
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>None</Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Audit count</Text>
            <Text style={styles.metricValue}>42</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Completed audits</Text>
            <View style={styles.valueWithCheck}>
              <Text style={styles.metricValue}>32</Text>
              <CheckCircleSmallIcon size={13} color={adminColors.success.text} />
            </View>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average score</Text>
            <Text style={[styles.metricValue, styles.scoreValue]}>86.7 / 100</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Lowest to highest</Text>
            <Text style={styles.metricValue}>81 to 91</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Findings</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.majorTag}>36 major</Text>
              <Text style={styles.metricValue}>,</Text>
              <Text style={styles.minorTag}>25 minor</Text>
            </View>
          </View>
          <View style={[styles.metricRow, styles.metricRowLast]}>
            <Text style={styles.metricLabel}>Missing audit coverage</Text>
            <Text style={styles.warningTag}>4 farmer-quarters</Text>
          </View>
        </View>

        {/* ─── Card 2: Missing Coverage ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderTop}>
            <Text style={styles.cardHeaderTitle}>Missing Coverage</Text>
            <View style={styles.badgeCountPill}>
              <Text style={styles.badgeCountText}>4 quarters pending</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {MISSING_COVERAGE_ROWS.map((item, index) => (
            <View
              key={item.name}
              style={[
                styles.coverageRow,
                index === MISSING_COVERAGE_ROWS.length - 1 && styles.coverageRowLast,
              ]}
            >
              <View style={styles.coverageLeftCol}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.coverageName}>{item.name}</Text>
                  <Text style={styles.coverageZone}>{item.zone}</Text>
                </View>
              </View>
              <View style={styles.quarterBadge}>
                <Text style={styles.quarterBadgeText}>{item.quarter}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Card 3: Compliance Information ─── */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Compliance Information</Text>
          <View style={styles.warningBox}>
            <AlertTriangleIcon size={18} color="#B45309" />
            <Text style={styles.warningText}>
              Compliance-tier configuration is missing. No tier is calculated or invented.
            </Text>
          </View>
        </View>

        {/* ─── Card 4: Audit Table ─── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderTop}>
            <Text style={styles.cardHeaderTitle}>Audit Records Summary</Text>
            <Text style={styles.tableCountTag}>8 of 42 records</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={styles.tableWrapper}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { width: 110 }]}>Audit</Text>
                <Text style={[styles.thCell, { width: 120 }]}>Farmer</Text>
                <Text style={[styles.thCell, { width: 80 }]}>Type</Text>
                <Text style={[styles.thCell, { width: 95 }]}>Date</Text>
                <Text style={[styles.thCell, { width: 95 }]}>Status</Text>
                <Text style={[styles.thCell, { width: 55, textAlign: 'right' }]}>Score</Text>
              </View>

              {/* Table Body */}
              {SAMPLE_AUDIT_ROWS.map((row) => (
                <View key={row.id} style={styles.tableBodyRow}>
                  <Text style={[styles.tdCell, styles.tdAuditCode, { width: 110 }]}>{row.id}</Text>
                  <Text style={[styles.tdCell, styles.tdFarmer, { width: 120 }]} numberOfLines={1}>{row.farmer}</Text>
                  <Text style={[styles.tdCell, { width: 80 }]}>{row.type}</Text>
                  <Text style={[styles.tdCell, { width: 95 }]}>{row.date}</Text>
                  <View style={{ width: 95 }}>
                    <View style={styles.completedPill}>
                      <Text style={styles.completedPillText}>{row.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tdCell, styles.tdScore, { width: 55, textAlign: 'right' }]}>{row.score}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.tableFooterText}>Showing sample preview of historical audit records.</Text>
        </View>

        {/* ─── Bottom Download Button ─── */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Download report"
        >
          <DownloadIcon size={19} color={adminColors.onBrand} />
          <Text style={styles.downloadButtonText}>Download Report</Text>
        </TouchableOpacity>
      </ScrollView>

      <AdminConfirmDialog
        visible={downloadModalVisible}
        title="Download Report"
        message={`Downloading ${reportTitle} as CSV / Excel...`}
        confirmLabel="OK"
        hideCancel
        variant="brand"
        onConfirm={() => setDownloadModalVisible(false)}
      />
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
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: 40,
  },

  // Card Structure
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 16,
    marginBottom: 14,
    ...adminShadow.sm,
    borderWidth: 1,
    borderColor: '#ECE5DE',
  },
  cardHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 16.5,
    fontWeight: '700',
  },
  cardHeaderSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3ECE4',
    marginVertical: 12,
  },

  // Pills & Badges
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusPillText: {
    ...adminType.caption,
    color: '#065F46',
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterPill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  filterPillText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeCountPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeCountText: {
    ...adminType.caption,
    color: '#92400E',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Metrics Rows
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9.5,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFEA',
  },
  metricRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  metricLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13.5,
  },
  metricValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '600',
  },
  valueWithCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreValue: {
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 14,
  },
  majorTag: {
    ...adminType.body,
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  minorTag: {
    ...adminType.body,
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 13,
  },
  warningTag: {
    ...adminType.body,
    color: '#B45309',
    fontWeight: '700',
    fontSize: 13,
  },

  // Missing Coverage
  coverageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFEA',
  },
  coverageRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  coverageLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 13,
  },
  coverageName: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  coverageZone: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11.5,
    marginTop: 1,
  },
  quarterBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: '#FEE0B6',
  },
  quarterBadgeText: {
    ...adminType.caption,
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },

  // Compliance Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: adminRadius.md,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    ...adminType.body,
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },

  // Table
  tableCountTag: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  tableWrapper: {
    minWidth: 555,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    borderRadius: adminRadius.md,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9F5F0',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E1D9',
  },
  thCell: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontSize: 12,
    fontWeight: '700',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F2ED',
    backgroundColor: adminColors.card,
  },
  tdCell: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
  },
  tdAuditCode: {
    fontSize: 12,
    color: adminColors.muted,
    fontWeight: '500',
  },
  tdFarmer: {
    fontWeight: '600',
  },
  completedPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  completedPillText: {
    ...adminType.caption,
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
  tdScore: {
    fontWeight: '700',
    color: adminColors.ink,
  },
  tableFooterText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 10,
  },

  // Bottom Download Button
  downloadButton: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  downloadButtonText: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 15.5,
    fontWeight: '700',
  },
});
