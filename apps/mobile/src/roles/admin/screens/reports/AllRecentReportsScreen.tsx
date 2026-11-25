import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { t } from '../../i18n';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentTextIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRight({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type RecentReportCategory = 'All' | 'Financial' | 'Farmers' | 'Operations' | 'Audits';

export interface RecentReportItem {
  id: string;
  title: string;
  category: RecentReportCategory;
  period: string;
  typeDesc: string;
  fileFormat: string;
  actionKey: 'pl' | 'farmer' | 'warehouse';
}

export interface AllRecentReportsScreenProps {
  onBack: () => void;
  onOpenPLReport: () => void;
  onOpenFarmerPerformanceReport: () => void;
  onOpenWarehouseOpsReport: () => void;
  reports?: RecentReportItem[] | undefined;
}

export function AllRecentReportsScreen({
  onBack,
  onOpenPLReport,
  onOpenFarmerPerformanceReport,
  onOpenWarehouseOpsReport,
  reports,
}: AllRecentReportsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<RecentReportCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const sourceReports = reports ?? [];

  const filteredReports = useMemo(() => {
    return sourceReports.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.typeDesc.toLowerCase().includes(q) ||
        item.period.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [sourceReports, selectedCategory, searchQuery]);

  function handleReportPress(actionKey: RecentReportItem['actionKey']) {
    if (actionKey === 'pl') {
      onOpenPLReport();
    } else if (actionKey === 'farmer') {
      onOpenFarmerPerformanceReport();
    } else if (actionKey === 'warehouse') {
      onOpenWarehouseOpsReport();
    }
  }

  const categories: RecentReportCategory[] = ['All', 'Financial', 'Farmers', 'Operations', 'Audits'];

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header Band matching Admin Standard */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to Reports"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Recent Reports</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Complete archive of generated platform reports & financial statements
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recent reports..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List of Reports */}
        <View style={styles.listSection}>
          {filteredReports.length === 0 ? (
            <AdminEmptyState variant="compact" title={t('reports.recent.empty.title')} subtitle={t('reports.recent.empty.message')} />
          ) : (
            filteredReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => handleReportPress(report.actionKey)}
                activeOpacity={0.7}
              >
                <View style={styles.reportLeft}>
                  <View style={styles.docIconSquare}>
                    <DocumentTextIcon size={22} color={adminColors.brand} />
                  </View>
                  <View style={styles.textCol}>
                    <View style={styles.titleRow}>
                      <Text style={styles.reportTitle} numberOfLines={1}>
                        {report.title}
                      </Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{report.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.reportDate}>{report.period}</Text>
                    <Text style={styles.fileSizeText}>{report.fileFormat}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={adminColors.muted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminOverlay.headerSubtitle,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    marginLeft: 10,
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  listSection: {
    gap: 12,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  reportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  docIconSquare: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  reportTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: adminColors.ink,
    flex: 1,
    marginRight: 6,
  },
  badge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
  },
  badgeText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  reportDate: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  fileSizeText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});

export default AllRecentReportsScreen;
