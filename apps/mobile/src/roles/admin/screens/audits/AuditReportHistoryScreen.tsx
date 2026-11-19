import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path, Rect } from 'react-native-svg';
import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminOverlay,
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
      <Path
        d="M3.5 8h17M16 4.5v7M3.5 16h17M8 12.5v7"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
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
      <Path
        d="M16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
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
  note?: string | undefined;
}

export interface AuditReportHistoryScreenProps {
  can?: Can | undefined;
  onBack: () => void;
  onDownloadReport?: ((reportId: string) => void) | undefined;
  onShareReport?: ((reportId: string) => void) | undefined;
}

// SPEC GAP: docs/openapi.yaml defines no endpoint for listing audit report history.
// All metadata and figures with no backing endpoint render em-dashes (—).

export function AuditReportHistoryScreen({
  can,
  onBack,
  onDownloadReport,
  onShareReport,
}: AuditReportHistoryScreenProps): React.JSX.Element {
  const canView = can ? can('audit.view') : true;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Ready' | 'Generating' | 'Failed'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Prototype items with em-dashes for all backend figures per rule
  const reportsList: ReportHistoryItem[] = useMemo(() => {
    if (!canView) return [];
    return [
      {
        id: 'audit_summary',
        title: 'Audit Summary Report',
        status: 'Ready',
        timestamp: 'Generated —',
        filtersText: 'Filters: — · — audits',
      },
      {
        id: 'farmer_history',
        title: 'Farmer Audit History',
        status: 'Ready',
        timestamp: 'Generated —',
        filtersText: 'Filters: — · — audits',
      },
      {
        id: 'quarterly_coverage',
        title: 'Quarterly Coverage',
        status: 'Ready',
        timestamp: 'Generated —',
        filtersText: 'Filters: — · — audits',
      },
      {
        id: 'findings_violations',
        title: 'Findings & Violations',
        status: 'Generating',
        timestamp: 'Requested —',
        filtersText: 'Filters: —',
        note: 'Download is available once generation finishes.',
      },
      {
        id: 'compliance_summary',
        title: 'Compliance Summary',
        status: 'Failed',
        timestamp: 'Requested —',
        filtersText: 'Filters: —',
        note: 'Tier configuration is not yet available on the server.',
      },
    ];
  }, [canView]);

  const filteredReports = useMemo(() => {
    return reportsList.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.filtersText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatusFilter === 'All' || item.status === selectedStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reportsList, searchQuery, selectedStatusFilter]);

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

  const handleResetFilters = () => {
    setSelectedStatusFilter('All');
    setDateFrom('');
    setDateTo('');
    setFilterModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
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
        {/* ── Search Bar with Filter Icon ── */}
        <View style={styles.searchContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search report history"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <HorizontalFilterIcon />
          </TouchableOpacity>
        </View>

        {/* ── List of Report Cards ── */}
        <View style={styles.listContainer}>
          {filteredReports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>—</Text>
            </View>
          ) : (
            filteredReports.map((item) => {
              const badgeColors = getStatusBadgeStyle(item.status);
              return (
                <View key={item.id} style={styles.reportCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeColors.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.timestampText}>{item.timestamp}</Text>
                  <Text style={styles.filtersText}>{item.filtersText}</Text>

                  {item.note && <Text style={styles.noteText}>{item.note}</Text>}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        if (onDownloadReport) onDownloadReport(item.id);
                      }}
                      disabled={!onDownloadReport || item.status !== 'Ready'}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          (!onDownloadReport || item.status !== 'Ready') && styles.actionBtnDisabled,
                        ]}
                      >
                        Download
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        if (onShareReport) onShareReport(item.id);
                      }}
                      disabled={!onShareReport || item.status !== 'Ready'}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          (!onShareReport || item.status !== 'Ready') && styles.actionBtnDisabled,
                        ]}
                      >
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Filter Modal ── */}
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
                style={styles.modalCloseBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFilterSectionLabel}>Status</Text>
            <View style={styles.filterPillsRow}>
              {(['All', 'Ready', 'Generating', 'Failed'] as const).map((status) => {
                const isActive = selectedStatusFilter === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => setSelectedStatusFilter(status)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalFilterSectionLabel}>Date Range (From / To)</Text>
            <View style={styles.modalDateRow}>
              <View style={styles.modalDateInputWrap}>
                <TextInput
                  style={styles.modalDateInput}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={adminColors.placeholder}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
                <CalendarInputIcon />
              </View>

              <View style={styles.modalDateInputWrap}>
                <TextInput
                  style={styles.modalDateInput}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={adminColors.placeholder}
                  value={dateTo}
                  onChangeText={setDateTo}
                />
                <CalendarInputIcon />
              </View>
            </View>

            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.resetModalBtn}
                onPress={handleResetFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.resetModalBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyModalBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
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
  listContainer: {
    gap: adminSpacing.md,
  },
  emptyContainer: {
    padding: adminSpacing.md,
    alignItems: 'center',
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
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
  },
  timestampText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  filtersText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 10,
  },
  noteText: {
    ...adminType.caption,
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
    color: adminColors.brandDeep,
  },
  actionBtnDisabled: {
    color: adminColors.muted,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
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
    color: adminColors.ink,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFilterSectionLabel: {
    ...adminType.caption,
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
    color: adminColors.ink,
  },
  filterPillTextActive: {
    color: adminColors.brandDeep,
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
    color: adminColors.ink,
    flex: 1,
    paddingVertical: 0,
  },
});
