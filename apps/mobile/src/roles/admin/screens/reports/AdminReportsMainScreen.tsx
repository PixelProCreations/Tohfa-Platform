import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { RecentReportDetailScreen } from './RecentReportDetailScreen';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

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

function BarChartIcon({ color = adminColors.brand, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function UserGroupIcon({ color = adminColors.brand, size = 20 }: { color?: string; size?: number }) {
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

function WarehouseBuildingIcon({ color = adminColors.brand, size = 20 }: { color?: string; size?: number }) {
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

function DocumentTextIcon({ color = adminColors.brand, size = 20 }: { color?: string; size?: number }) {
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

function ChevronRight({ color = adminColors.muted, size = 18 }: { color?: string; size?: number }) {
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
  onOpenOperationalReports?: () => void;
  onOpenReportBuilder?: () => void;
  onOpenSystemAlerts?: () => void;
  onOpenAnnouncements?: () => void;
  onOpenAllRecentReports?: () => void;
  recentDocs?: RecentDocItem[] | undefined;
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

export function AdminReportsMainScreen({
  onBack,
  onOpenPLReport,
  onOpenFarmerPerformanceReport,
  onOpenWarehouseOpsReport,
  onOpenAnalyticsDashboard,
  onOpenOperationalReports,
  onOpenReportBuilder,
  onOpenSystemAlerts,
  onOpenAnnouncements,
  onOpenAllRecentReports,
  recentDocs,
}: AdminReportsMainScreenProps) {
  const [selectedRecentDoc, setSelectedRecentDoc] = useState<RecentDocItem | null>(null);
  const docsList = recentDocs ?? [];

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
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header Band matching Admin Standard */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleGroup}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Back to Dashboard"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Reports</Text>
          </View>

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
        <Text style={styles.headerSubtitle}>View reports, alerts & analytics</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                <BarChartIcon size={20} color={adminColors.brand} />
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
                <UserGroupIcon size={20} color={adminColors.brand} />
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
                <WarehouseBuildingIcon size={20} color={adminColors.brand} />
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

          {/* Warehouse Operational Reports */}
          {onOpenOperationalReports ? (
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onOpenOperationalReports}
              activeOpacity={0.7}
            >
              <View style={styles.quickLeft}>
                <View style={styles.quickIconCircle}>
                  <DocumentTextIcon size={20} color={adminColors.brand} />
                </View>
                <View style={styles.quickTextCol}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.quickTitle}>Operational Warehouse Reports</Text>
                    <View style={styles.miniLiveTag}>
                      <Text style={styles.miniLiveTagText}>System</Text>
                    </View>
                  </View>
                  <Text style={styles.quickSub}>Sales, inventory, receiving, customer & exports</Text>
                </View>
              </View>
              <ChevronRight />
            </TouchableOpacity>
          ) : null}
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
              <BarChartIcon size={22} color={adminColors.brand} />
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
          {docsList.length === 0 ? (
            <AdminEmptyState title="No recent reports" subtitle="Generated reports and exports will appear here." />
          ) : (
            docsList.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.recentCard}
                onPress={() => setSelectedRecentDoc(doc)}
                activeOpacity={0.7}
              >
                <View style={styles.recentLeft}>
                  <View style={styles.recentDocIconSquare}>
                    <DocumentTextIcon size={20} color={adminColors.brand} />
                  </View>
                  <View style={styles.recentTextCol}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.recentTitle} numberOfLines={1}>{doc.title}</Text>
                      {doc.fileSize !== ADMIN_NO_VALUE ? (
                        <View style={styles.docFilePill}>
                          <Text style={styles.docFilePillText}>{doc.fileSize}</Text>
                        </View>
                      ) : null}
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
            ))
          )}
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
                    stroke={adminColors.brand}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={adminColors.brand} strokeWidth="2" />
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
                    stroke={adminColors.brand}
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
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
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
  createReportHeaderBtn: {
    backgroundColor: adminOverlay.whitePill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
  },
  createReportHeaderBtnText: {
    color: adminColors.onBrand,
    ...adminType.caption,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.muted,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  listSection: {
    marginBottom: 20,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  quickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickIconCircle: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickTextCol: {
    flex: 1,
  },
  quickTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  quickSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  analyticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    ...adminShadow.sm,
  },
  analyticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  analyticsIconSquare: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  analyticsTextCol: {
    flex: 1,
  },
  analyticsTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  analyticsSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontWeight: '700',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentDocIconSquare: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  recentTextCol: {
    flex: 1,
  },
  recentTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  recentDate: {
    ...adminType.rowMeta,
    color: adminColors.muted,
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
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    ...adminShadow.sm,
  },
  shortcutIconContainer: {
    marginRight: 8,
  },
  shortcutTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
  },
  // Section Headers & Live Badges
  sectionHeaderWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.success.border,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: adminColors.success.text,
    marginRight: 5,
  },
  liveBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  sectionSubHeading: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: -6,
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  miniLiveTag: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
  },
  miniLiveTagText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  // Doc Cards & Tags
  docFilePill: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
  },
  docFilePillText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  docTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  docCategoryBadge: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  docCategoryBadgeText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});

export default AdminReportsMainScreen;
