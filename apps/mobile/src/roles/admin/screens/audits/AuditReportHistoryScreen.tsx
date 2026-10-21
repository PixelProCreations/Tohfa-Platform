import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
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

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HorizontalFilterIcon({ size = 19, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top slider bar with vertical pip */}
      <Line x1="3.5" y1="8" x2="20.5" y2="8" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="16" y1="4.5" x2="16" y2="11.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Bottom slider bar with vertical pip */}
      <Line x1="3.5" y1="16" x2="20.5" y2="16" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="8" y1="12.5" x2="8" y2="19.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarInputIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ReportHistoryItem {
  id: string;
  title: string;
  status: 'Ready' | 'Generating' | 'Failed';
  timestamp: string;
  filtersText: string;
  note?: string;
  allowPreview?: boolean;
}

export interface AuditReportHistoryScreenProps {
  onBack: () => void;
  onOpenReportDetails?: (reportId: string) => void;
}

export function AuditReportHistoryScreen({
  onBack,
  onOpenReportDetails,
}: AuditReportHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Ready' | 'Generating' | 'Failed'>('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Exact 5 items matching media_1792339614899.png
  const [reportsList, setReportsList] = useState<ReportHistoryItem[]>([
    {
      id: 'audit_summary',
      title: 'Audit Summary Report',
      status: 'Ready',
      timestamp: 'Generated 14 Oct 2026, 10:00 · Demo TOHFA Admin',
      filtersText: 'Filters: None · 42 audits',
      allowPreview: true,
    },
    {
      id: 'farmer_history',
      title: 'Farmer Audit History',
      status: 'Ready',
      timestamp: 'Generated 10 Oct 2026, 15:20 · Demo TOHFA Admin',
      filtersText: 'Filters: Farmer = Ramesh Kumar · 6 audits',
      allowPreview: true,
    },
    {
      id: 'quarterly_coverage',
      title: 'Quarterly Coverage',
      status: 'Ready',
      timestamp: 'Generated 3 Oct 2026, 09:05 · Demo TOHFA Admin',
      filtersText: 'Filters: Zone = Coonoor · Q3 2026',
      allowPreview: true,
    },
    {
      id: 'findings_violations',
      title: 'Findings & Violations',
      status: 'Generating',
      timestamp: 'Requested 14 Oct 2026, 11:42 · Demo TOHFA Admin',
      filtersText: 'Filters: Status = Major findings',
      note: 'Preview and download are available once generation finishes.',
      allowPreview: false,
    },
    {
      id: 'compliance_summary',
      title: 'Compliance Summary',
      status: 'Failed',
      timestamp: 'Requested 1 Oct 2026, 08:15 · Demo TOHFA Admin',
      filtersText: '',
      note: 'Compliance-tier configuration is missing, so this report could not be completed.',
      allowPreview: false,
    },
  ]);

  const filteredReports = reportsList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.filtersText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatusFilter === 'All' || item.status === selectedStatusFilter;
    const matchesType =
      selectedTypeFilter === 'All' || item.title.toLowerCase().includes(selectedTypeFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDownloadCsv = (report: ReportHistoryItem) => {
    Alert.alert('Download CSV', `Downloading CSV for ${report.title}...`);
  };

  const handleRetry = (report: ReportHistoryItem) => {
    Alert.alert('Retrying', `Retrying compilation for ${report.title}...`);
    setReportsList((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: 'Generating' as const,
              note: 'Regenerating report data in the background...',
            }
          : r
      )
    );
  };

  const getStatusBadgeStyle = (status: ReportHistoryItem['status']) => {
    switch (status) {
      case 'Ready':
        return {
          bg: adminColors.success.bg,
          text: adminColors.success.text,
        };
      case 'Generating':
        return {
          bg: adminColors.warning.bg,
          text: adminColors.warning.text,
        };
      case 'Failed':
        return {
          bg: adminColors.danger.bg,
          text: adminColors.danger.text,
        };
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner Matching media_1792339614899.png ── */}
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
            Report History
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar with Filter Icon Matching media_1792339614899.png ── */}
        <View style={styles.searchContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search audit or farmer"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Filter reports"
          >
            <HorizontalFilterIcon size={19} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Reports Cards List Matching media_1792339614899.png ── */}
        <View style={styles.listContainer}>
          {filteredReports.map((report) => {
            const badge = getStatusBadgeStyle(report.status);

            return (
              <View key={report.id} style={styles.reportCard}>
                {/* Header Row: Title & Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{report.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {report.status}
                    </Text>
                  </View>
                </View>

                {/* Subtitle / Timestamp */}
                <Text style={styles.timestampText}>{report.timestamp}</Text>

                {/* Filter metadata info */}
                {report.filtersText ? (
                  <Text style={styles.filtersText}>{report.filtersText}</Text>
                ) : null}

                {/* Note for Generating or Failed */}
                {report.note ? (
                  <Text style={styles.noteText}>{report.note}</Text>
                ) : null}

                {/* Action Links Row */}
                {report.status === 'Ready' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        if (onOpenReportDetails) onOpenReportDetails(report.id);
                        else {
                          Alert.alert('Report Details', `Opening ${report.title}`);
                        }
                      }}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDownloadCsv(report)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>Download CSV</Text>
                    </TouchableOpacity>
                  </View>
                ) : report.status === 'Failed' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => handleRetry(report)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Filter Popup Modal ── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Reports</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
                style={styles.modalCloseBtn}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            {/* 1. Report Type Filter */}
            <Text style={styles.modalFilterSectionLabel}>Report type</Text>
            <View style={styles.filterPillsRow}>
              {(['All', 'Audit Summary', 'Farmer History', 'Quarterly', 'Findings', 'Compliance'] as const).map((typeOpt) => (
                <TouchableOpacity
                  key={typeOpt}
                  style={[
                    styles.filterPill,
                    selectedTypeFilter === typeOpt && styles.filterPillActive,
                  ]}
                  onPress={() => setSelectedTypeFilter(typeOpt)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      selectedTypeFilter === typeOpt && styles.filterPillTextActive,
                    ]}
                  >
                    {typeOpt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 2. Date Range */}
            <Text style={styles.modalFilterSectionLabel}>Date range</Text>
            <View style={styles.modalDateRow}>
              <View style={styles.modalDateInputWrap}>
                <TextInput
                  style={styles.modalDateInput}
                  placeholder="Date from (dd-mm-yyyy)"
                  placeholderTextColor={adminColors.placeholder}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
                <CalendarInputIcon />
              </View>

              <View style={styles.modalDateInputWrap}>
                <TextInput
                  style={styles.modalDateInput}
                  placeholder="Date to (dd-mm-yyyy)"
                  placeholderTextColor={adminColors.placeholder}
                  value={dateTo}
                  onChangeText={setDateTo}
                />
                <CalendarInputIcon />
              </View>
            </View>

            {/* 3. Status Filter */}
            <Text style={styles.modalFilterSectionLabel}>Status</Text>
            <View style={styles.filterPillsRow}>
              {(['All', 'Ready', 'Generating', 'Failed'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.filterPill,
                    selectedStatusFilter === st && styles.filterPillActive,
                  ]}
                  onPress={() => setSelectedStatusFilter(st)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      selectedStatusFilter === st && styles.filterPillTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.resetModalBtn}
                onPress={() => {
                  setSelectedStatusFilter('All');
                  setFilterModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.resetModalBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyModalBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyModalBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Search Bar (media_1792339614899.png)
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List of Report Cards
  listContainer: {
    gap: adminSpacing.md,
  },
  reportCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  timestampText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 4,
  },
  filtersText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 10,
  },
  noteText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.lg,
    marginTop: 4,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFilterSectionLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 8,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: adminSpacing.lg,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  filterPillActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  filterPillText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.ink,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  resetModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  resetModalBtnText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.muted,
  },
  applyModalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
  },
  applyModalBtnText: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  modalDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.md,
  },
  modalDateInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.sm,
    height: 40,
  },
  modalDateInput: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.ink,
    flex: 1,
    paddingVertical: 0,
  },
});
