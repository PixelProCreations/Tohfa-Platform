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
import { RecentReportDetailScreen } from './RecentReportDetailScreen';
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
  blueIconBg: '#EBF3FA',
  blueIcon: '#1D6399',
  greenSuccess: '#16A34A',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BarChartIcon({ color = P.orange, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function UserGroupIcon({ color = P.orange, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseBuildingIcon({ color = P.orange, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21V9L12 3L21 9V21H3Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V13H15V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentTextIcon({ color = P.blueIcon, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRight({ color = P.subtitle, size = 18 }: { color?: string; size?: number }) {
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

export interface AdminReportsMainScreenProps {
  onBack?: () => void;
  onOpenPLReport: () => void;
  onOpenFarmerPerformanceReport: () => void;
  onOpenWarehouseOpsReport: () => void;
  onOpenAnalyticsDashboard: () => void;
  onOpenReportBuilder?: () => void;
  onOpenSystemAlerts?: () => void;
  onOpenAnnouncements?: () => void;
  onOpenAllRecentReports?: () => void;
}

export interface RecentDocItem {
  id: string;
  title: string;
  categoryBadge: string;
  badgeColor: string;
  dateStr: string;
  fileFormat: string;
  fileSize: string;
  summaryMetrics: { label: string; value: string }[];
  actionType: 'pl' | 'farmer' | 'warehouse';
}

const RECENT_DOCS: RecentDocItem[] = [
  {
    id: 'doc-pl-aug',
    title: 'Audited P&L Statement (Aug 2026)',
    categoryBadge: 'Audited Financial',
    badgeColor: '#7E2E11',
    dateStr: 'Generated 25 Sep 2026 · Closed Monthly Period',
    fileFormat: 'PDF Document',
    fileSize: '2.1 MB',
    summaryMetrics: [
      { label: 'Gross Revenue', value: '₹17.92L' },
      { label: 'Net Profit', value: '₹6.84L' },
      { label: 'EBITDA Margin', value: '38.2%' },
    ],
    actionType: 'pl',
  },
  {
    id: 'doc-farmer-payout',
    title: 'Farmer Mandi Parity & Payout Ledger',
    categoryBadge: 'Banking Settlement',
    badgeColor: '#16A34A',
    dateStr: 'Generated Yesterday · 420 Farmers Disbursed',
    fileFormat: 'Excel Spreadsheet',
    fileSize: '1.4 MB',
    summaryMetrics: [
      { label: 'Total Disbursed', value: '₹8.20L' },
      { label: 'Farmers Paid', value: '420' },
      { label: 'Mandi Parity Uplift', value: '+8.4%' },
    ],
    actionType: 'farmer',
  },
  {
    id: 'doc-warehouse-audit',
    title: 'Kotagiri & Ooty Hub Cold-Chain Audit',
    categoryBadge: 'Facility Compliance',
    badgeColor: '#1D6399',
    dateStr: 'Generated 3d ago · FSSAI Certified Hubs',
    fileFormat: 'PDF Document',
    fileSize: '3.2 MB',
    summaryMetrics: [
      { label: 'Capacity Inspected', value: '225 MT' },
      { label: 'Stock Turnover', value: '4.2x' },
      { label: 'QC Compliance', value: '100% Pass' },
    ],
    actionType: 'warehouse',
  },
];

export function AdminReportsMainScreen({
  onBack,
  onOpenPLReport,
  onOpenFarmerPerformanceReport,
  onOpenWarehouseOpsReport,
  onOpenAnalyticsDashboard,
  onOpenReportBuilder,
  onOpenSystemAlerts,
  onOpenAnnouncements,
  onOpenAllRecentReports,
}: AdminReportsMainScreenProps) {
  const [selectedRecentDoc, setSelectedRecentDoc] = useState<RecentDocItem | null>(null);

  if (selectedRecentDoc) {
    return (
      <RecentReportDetailScreen
        doc={selectedRecentDoc}
        onBack={() => setSelectedRecentDoc(null)}
        onOpenLiveModule={() => {
          const action = selectedRecentDoc.actionType;
          setSelectedRecentDoc(null);
          if (action === 'pl') onOpenPLReport();
          else if (action === 'farmer') onOpenFarmerPerformanceReport();
          else if (action === 'warehouse') onOpenWarehouseOpsReport();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row with Back Button & Create Report */}
        <View style={styles.topBar}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Back to Dashboard"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 19L8 12L15 5"
                  stroke="#2B2523"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}

          {onOpenReportBuilder && (
            <TouchableOpacity
              style={styles.createReportHeaderBtn}
              onPress={onOpenReportBuilder}
              activeOpacity={0.8}
            >
              <Text style={styles.createReportHeaderBtnText}>+ Create Report</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Reports</Text>
          <Text style={styles.pageSubtitle}>View reports, alerts & analytics</Text>
        </View>

        {/* ─── 1. Quick Reports (Live Interactive Dashboards) ────────────────── */}
        <View style={styles.sectionHeaderWithBadge}>
          <Text style={styles.sectionHeading}>Quick reports</Text>
          <View style={styles.liveIndicatorBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Live Dashboards</Text>
          </View>
        </View>

        <View style={styles.listSection}>
          {/* Live P&L Performance */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={onOpenPLReport}
            activeOpacity={0.7}
          >
            <View style={styles.quickLeft}>
              <View style={styles.quickIconCircle}>
                <BarChartIcon size={20} color={P.orange} />
              </View>
              <View style={styles.quickTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.quickTitle}>Live P&L Performance</Text>
                  <View style={styles.miniLiveTag}>
                    <Text style={styles.miniLiveTagText}>MTD</Text>
                  </View>
                </View>
                <Text style={styles.quickSub}>Real-time revenue streams, OpEx & EBITDA margins</Text>
              </View>
            </View>
            <ChevronRight />
          </TouchableOpacity>

          {/* Farmer Scorecard & Ratings */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={onOpenFarmerPerformanceReport}
            activeOpacity={0.7}
          >
            <View style={styles.quickLeft}>
              <View style={styles.quickIconCircle}>
                <UserGroupIcon size={20} color={P.orange} />
              </View>
              <View style={styles.quickTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.quickTitle}>Farmer Scorecard & Ratings</Text>
                  <View style={styles.miniLiveTag}>
                    <Text style={styles.miniLiveTagText}>Active</Text>
                  </View>
                </View>
                <Text style={styles.quickSub}>Onboarding, verified KYC & harvest yields</Text>
              </View>
            </View>
            <ChevronRight />
          </TouchableOpacity>

          {/* Warehouse Hub Operations */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={onOpenWarehouseOpsReport}
            activeOpacity={0.7}
          >
            <View style={styles.quickLeft}>
              <View style={styles.quickIconCircle}>
                <WarehouseBuildingIcon size={20} color={P.orange} />
              </View>
              <View style={styles.quickTextCol}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.quickTitle}>Warehouse Hub Operations</Text>
                  <View style={styles.miniLiveTag}>
                    <Text style={styles.miniLiveTagText}>4 Hubs</Text>
                  </View>
                </View>
                <Text style={styles.quickSub}>Live stock capacity, turnover & dispatch telemetry</Text>
              </View>
            </View>
            <ChevronRight />
          </TouchableOpacity>
        </View>

        {/* ─── 2. Analytics ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Analytics</Text>
        <TouchableOpacity
          style={styles.analyticsCard}
          onPress={onOpenAnalyticsDashboard}
          activeOpacity={0.7}
        >
          <View style={styles.analyticsLeft}>
            <View style={styles.analyticsIconSquare}>
              <BarChartIcon size={22} color={P.orange} />
            </View>
            <View style={styles.analyticsTextCol}>
              <Text style={styles.analyticsTitle}>Analytics Dashboards</Text>
              <Text style={styles.analyticsSubtitle}>Farmers, Customers, Warehouses, Sales</Text>
            </View>
          </View>
          <ChevronRight />
        </TouchableOpacity>

        {/* ─── 3. Recent Reports (Archived Documents & PDF Audits) ──────────── */}
        <View style={styles.recentSectionHeader}>
          <View>
            <Text style={styles.sectionHeading}>Recent reports</Text>
            <Text style={styles.sectionSubHeading}>Exported statements & audit files</Text>
          </View>
          {(onOpenAllRecentReports || onOpenReportBuilder) && (
            <TouchableOpacity
              onPress={onOpenAllRecentReports ?? onOpenReportBuilder}
              activeOpacity={0.7}
              accessibilityLabel="View all recent reports"
            >
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listSection}>
          {RECENT_DOCS.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.recentCard}
              onPress={() => setSelectedRecentDoc(doc)}
              activeOpacity={0.7}
            >
              <View style={styles.recentLeft}>
                <View style={styles.recentDocIconSquare}>
                  <DocumentTextIcon size={20} color={P.orange} />
                </View>
                <View style={styles.recentTextCol}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.recentTitle} numberOfLines={1}>{doc.title}</Text>
                    <View style={styles.docFilePill}>
                      <Text style={styles.docFilePillText}>{doc.fileSize}</Text>
                    </View>
                  </View>
                  <Text style={styles.recentDate}>{doc.dateStr}</Text>
                  <View style={styles.docTagRow}>
                    <View style={styles.docCategoryBadge}>
                      <Text style={styles.docCategoryBadgeText}>{doc.categoryBadge}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <ChevronRight />
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── 4. Bottom Cards: System Alerts & Announcements ───────────────── */}
        <View style={styles.bottomShortcutsRow}>
          {onOpenSystemAlerts && (
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={onOpenSystemAlerts}
              activeOpacity={0.8}
            >
              <View style={styles.shortcutIconContainer}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                    stroke={P.titleBrown}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={P.titleBrown} strokeWidth="2" />
                </Svg>
              </View>
              <Text style={styles.shortcutTitle}>System Alerts</Text>
            </TouchableOpacity>
          )}

          {onOpenAnnouncements && (
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={onOpenAnnouncements}
              activeOpacity={0.8}
            >
              <View style={styles.shortcutIconContainer}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke={P.titleBrown}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.shortcutTitle}>Announcements</Text>
            </TouchableOpacity>
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
    backgroundColor: P.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  createReportHeaderBtn: {
    backgroundColor: P.orange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  createReportHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  headerBlock: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: P.titleBrown,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: P.subtitle,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  listSection: {
    marginBottom: 20,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  quickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: P.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickTextCol: {
    flex: 1,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  quickSub: {
    fontSize: 12,
    color: P.subtitle,
  },
  analyticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  analyticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  analyticsIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: P.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  analyticsTextCol: {
    flex: 1,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  analyticsSubtitle: {
    fontSize: 12,
    color: P.subtitle,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentDocIconSquare: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: P.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  recentTextCol: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    color: P.subtitle,
  },
  bottomShortcutsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  shortcutCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  shortcutIconContainer: {
    marginRight: 8,
  },
  shortcutTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.titleBrown,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTag: {
    alignSelf: 'flex-start',
    backgroundColor: P.orangeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.orange,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 12.5,
    color: P.subtitle,
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: P.cardBorder,
    marginBottom: 14,
  },
  modalDetailsText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 20,
  },
  modalCloseBtn: {
    backgroundColor: P.orange,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // New Section Headers & Live Badges
  sectionHeaderWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDFDF2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 5,
  },
  liveBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  sectionSubHeading: {
    fontSize: 12,
    color: P.subtitle,
    marginTop: -8,
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  miniLiveTag: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniLiveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: P.titleBrown,
  },
  // Doc Cards & Tags
  docFilePill: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  docFilePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7E2E11',
  },
  docTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  docCategoryBadge: {
    backgroundColor: '#FFF1EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: P.orange,
  },
  verifiedTag: {
    backgroundColor: '#EDFDF2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
});

export default AdminReportsMainScreen;
