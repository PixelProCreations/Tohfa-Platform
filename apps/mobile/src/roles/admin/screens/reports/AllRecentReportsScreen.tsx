import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  greenSuccess: '#16A34A',
  greenBg: '#EDFDF2',
  blueIconBg: '#EBF3FA',
  blueIcon: '#1D6399',
  border: '#F0ECE6',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19L8 12L15 5"
        stroke="#2B2523"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#827871' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentTextIcon({ size = 20, color = P.orange }: { size?: number; color?: string }) {
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

function ChevronRight({ size = 18, color = '#B8AEA8' }: { size?: number; color?: string }) {
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

const RECENT_REPORTS_DATA: RecentReportItem[] = [
  {
    id: 'rep-1',
    title: 'P&L Report',
    category: 'Financial',
    period: 'September 2026 MTD',
    typeDesc: 'Financial Statements & EBITDA',
    fileFormat: 'PDF · 1.8 MB',
    actionKey: 'pl',
  },
  {
    id: 'rep-2',
    title: 'Farmer Performance Summary',
    category: 'Farmers',
    period: 'Generated Yesterday',
    typeDesc: 'Farmer Aggregation & Grade A Payouts',
    fileFormat: 'PDF · 2.4 MB',
    actionKey: 'farmer',
  },
  {
    id: 'rep-3',
    title: 'Warehouse Operations Audit',
    category: 'Operations',
    period: 'Generated 3d ago',
    typeDesc: 'Kotagiri & Ooty Hub Stock Reconciliations',
    fileFormat: 'PDF · 1.6 MB',
    actionKey: 'warehouse',
  },
  {
    id: 'rep-4',
    title: 'P&L Statement (August 2026)',
    category: 'Financial',
    period: 'Closed August 2026',
    typeDesc: 'Consolidated Audited Monthly P&L',
    fileFormat: 'PDF · 2.1 MB',
    actionKey: 'pl',
  },
  {
    id: 'rep-5',
    title: 'Farmgate Procurement & Mandi Batches',
    category: 'Operations',
    period: 'Generated 4d ago',
    typeDesc: 'Daily Lot Inflow & Weighment Log',
    fileFormat: 'PDF · 1.2 MB',
    actionKey: 'warehouse',
  },
  {
    id: 'rep-6',
    title: 'Quality Sorting & QC Rejection Audit',
    category: 'Audits',
    period: 'Generated 5d ago',
    typeDesc: 'Grading Discard & Spoilage Analysis',
    fileFormat: 'PDF · 1.9 MB',
    actionKey: 'warehouse',
  },
  {
    id: 'rep-7',
    title: 'Farmer KYC & Verification Registry',
    category: 'Farmers',
    period: 'Generated 1w ago',
    typeDesc: 'Compliance Tiers & Aadhaar Verification',
    fileFormat: 'PDF · 3.1 MB',
    actionKey: 'farmer',
  },
  {
    id: 'rep-8',
    title: 'Direct Farmer Payout Settlement Audit',
    category: 'Financial',
    period: 'Generated 1w ago',
    typeDesc: 'Banking Settlement & Escrow Clearing',
    fileFormat: 'PDF · 1.4 MB',
    actionKey: 'pl',
  },
];

export interface AllRecentReportsScreenProps {
  onBack: () => void;
  onOpenPLReport: () => void;
  onOpenFarmerPerformanceReport: () => void;
  onOpenWarehouseOpsReport: () => void;
}

export function AllRecentReportsScreen({
  onBack,
  onOpenPLReport,
  onOpenFarmerPerformanceReport,
  onOpenWarehouseOpsReport,
}: AllRecentReportsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<RecentReportCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = useMemo(() => {
    return RECENT_REPORTS_DATA.filter((item) => {
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
  }, [selectedCategory, searchQuery]);

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
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row with Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to Reports"
          >
            <BackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Heading */}
        <Text style={styles.pageTitle}>All Recent Reports</Text>
        <Text style={styles.pageSubtitle}>
          Complete archive of generated platform reports & financial statements
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#827871" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recent reports..."
            placeholderTextColor="#827871"
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

        {/* Reports List */}
        <View style={styles.listSection}>
          {filteredReports.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No matching reports found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query or filter category.
              </Text>
            </View>
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
                    <DocumentTextIcon size={22} color={P.orange} />
                  </View>
                  <View style={styles.textCol}>
                    <View style={styles.titleRow}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{report.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.reportDate}>{report.period} · {report.typeDesc}</Text>
                    <Text style={styles.fileSizeText}>{report.fileFormat}</Text>
                  </View>
                </View>
                <ChevronRight />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: P.titleBrown,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: P.subtitle,
    marginBottom: 18,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: P.cardBorder,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: P.ink,
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
    borderRadius: 20,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.cardBorder,
  },
  chipActive: {
    backgroundColor: P.orange,
    borderColor: P.orange,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: P.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listSection: {
    gap: 12,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
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
    borderRadius: 12,
    backgroundColor: P.orangeBg,
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
    fontSize: 14,
    fontWeight: '600',
    color: P.ink,
    flex: 1,
    marginRight: 6,
  },
  badge: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: P.titleBrown,
  },
  reportDate: {
    fontSize: 12,
    color: P.subtitle,
    marginBottom: 2,
  },
  fileSizeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyCard: {
    backgroundColor: P.cardBg,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.cardBorder,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: P.ink,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: P.subtitle,
    textAlign: 'center',
  },
});
