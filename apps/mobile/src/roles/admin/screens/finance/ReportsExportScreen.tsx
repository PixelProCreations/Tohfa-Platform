import React, { useState, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { PreviewReportsScreen } from './PreviewReportsScreen';
import { ReportsScreen } from '../warehouse/reports';

export interface ReportsExportScreenProps {
  onBack: () => void;
  onNavigateToExport?: () => void;
  can?: (code: string) => boolean;
}

interface ExportRecord {
  id: string;
  code: string;
  title: string;
  category: string;
  status: 'Ready' | 'Failed' | 'Processing';
  period: string;
  warehouses: string;
  format: string;
  requestedBy: string;
  requestedDate: string;
  completedDate: string;
  downloadUrl?: string;
}

const SAMPLE_EXPORTS: ExportRecord[] = [
  {
    id: 'exp-0003',
    code: 'EXP-REQ-0003',
    title: 'Expenses export',
    category: 'Expenses',
    status: 'Ready',
    period: '1 Oct 2026 to 14 Oct 2026',
    warehouses: 'All warehouses',
    format: 'XLSX',
    requestedBy: 'Demo Super Admin',
    requestedDate: '14 Oct 2026, 10:00',
    completedDate: '14 Oct 2026, 10:00',
  },
  {
    id: 'exp-0002',
    code: 'EXP-REQ-0002',
    title: 'Payouts (demo)',
    category: 'Farmer Purchase & Payouts',
    status: 'Failed',
    period: '14 Sep 2026 to 14 Oct 2026',
    warehouses: 'All warehouses',
    format: 'XLSX',
    requestedBy: 'Demo TOHFA Admin',
    requestedDate: '11 Oct 2026, 09:00',
    completedDate: '—',
  },
  {
    id: 'exp-0001',
    code: 'EXP-REQ-0001',
    title: 'Expenses, last month (demo)',
    category: 'Expenses',
    status: 'Ready',
    period: '14 Sep 2026 to 13 Oct 2026',
    warehouses: 'Ooty',
    format: 'CSV',
    requestedBy: 'Demo Main Warehouse Admin',
    requestedDate: '10 Oct 2026, 10:00',
    completedDate: '10 Oct 2026, 10:01',
  },
];

export function ReportsExportScreen({ onBack, onNavigateToExport, can }: ReportsExportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'preview'>('list');
  const [selectedPreviewReport, setSelectedPreviewReport] = useState<{
    reportName: string;
    category: string;
    period: string;
    warehouse: string;
    format: string;
  } | null>(null);

  const filteredExports = useMemo(() => {
    if (!searchQuery.trim()) return SAMPLE_EXPORTS;
    const q = searchQuery.toLowerCase();
    return SAMPLE_EXPORTS.filter(
      (exp) =>
        exp.code.toLowerCase().includes(q) ||
        exp.title.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleDownloadClick = (exp?: ExportRecord) => {
    // RBAC check: must have report.export.file permission
    if (can && !can('report.export.file')) {
      Alert.alert(
        'Access Restricted',
        'Your role lacks permission to export finance reports (report.export.file).'
      );
      return;
    }
    if (onNavigateToExport) {
      onNavigateToExport();
    } else {
      setCurrentView('create');
    }
  };

  const handleViewDetails = (exp: ExportRecord) => {
    // RBAC check: view permission
    if (can && !can('report.export.file') && !can('finance.pnl.view')) {
      Alert.alert(
        'Access Restricted',
        'Your role lacks permission to view finance reports.'
      );
      return;
    }
    setSelectedPreviewReport({
      reportName: exp.title,
      category: exp.category,
      period: exp.period,
      warehouse: exp.warehouses,
      format: exp.format,
    });
    setCurrentView('preview');
  };

  if (currentView === 'preview') {
    return (
      <PreviewReportsScreen
        onBack={() => {
          setCurrentView('list');
          setSelectedPreviewReport(null);
        }}
        reportData={selectedPreviewReport}
        onDownload={() => handleDownloadClick()}
      />
    );
  }

  if (currentView === 'create') {
    return (
      <ReportsScreen
        scope={{ warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' }}
        can={can || ((() => true) as any)}
        canExport={can ? can('report.export.file') : true}
        onBack={() => setCurrentView('list')}
        initialScreen="export_report"
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={adminColors.onBrand}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports & Export</Text>
          <TouchableOpacity
            style={styles.headerExportButton}
            onPress={() => handleDownloadClick()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create export report"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 3v12M12 15l4-4M12 15l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                stroke={adminColors.onBrand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx="11" cy="11" r="8" stroke={adminColors.muted} strokeWidth="2" />
            <Path d="M21 21l-4.35-4.35" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Filter exports"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 6h16M7 12h10M10 18h4"
                stroke={adminColors.brand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Counter */}
        <Text style={styles.countText}>{filteredExports.length} exports</Text>

        {/* Export Cards List */}
        <View style={styles.cardsList}>
          {filteredExports.map((exp) => {
            const isReady = exp.status === 'Ready';
            return (
              <View key={exp.id} style={styles.exportCard}>
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>
                    {exp.code} · {exp.title}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isReady ? styles.statusReadyBadge : styles.statusFailedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isReady ? styles.statusReadyText : styles.statusFailedText,
                      ]}
                    >
                      {exp.status}
                    </Text>
                  </View>
                </View>

                {/* Subtitle Lines */}
                <Text style={styles.categoryText}>{exp.category}</Text>
                <Text style={styles.metaText}>
                  Period {exp.period} · {exp.warehouses} · {exp.format}
                </Text>
                <Text style={styles.metaText}>
                  Requested by {exp.requestedBy}, {exp.requestedDate} · Completed {exp.completedDate}
                </Text>

                {/* Actions Row */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    onPress={() => handleViewDetails(exp)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.actionLinkText}>View Details</Text>
                  </TouchableOpacity>

                  {isReady && (
                    <TouchableOpacity
                      onPress={() => handleDownloadClick(exp)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.actionLinkText}>Download</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    flex: 1,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  headerExportButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 6,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  cardsList: {
    gap: adminSpacing.md,
  },
  exportCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusReadyBadge: {
    backgroundColor: adminColors.success.bg,
  },
  statusFailedBadge: {
    backgroundColor: adminColors.danger.bg,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusReadyText: {
    color: adminColors.success.text,
  },
  statusFailedText: {
    color: adminColors.danger.text,
  },
  categoryText: {
    fontSize: 12,
    color: adminColors.ink,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
});
