import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';
import { useFarmerList, useFarmerSummary } from '../../api/farmerHooks';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';

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
  greenLight: '#EAF7EE',
  greenBar: '#2E7D32',
  blueIconBg: '#EBF3FA',
  blueIcon: '#1D6399',
  purpleIconBg: '#F3E8FF',
  purpleIcon: '#7E22CE',
  amberIconBg: '#FEF3E2',
  amberIcon: '#B45309',
};

export type TimeframeFilter = 'This Month' | 'Last Quarter' | 'Year to Date';
export type ClusterFilter = 'All Clusters' | 'Ooty Central' | 'Kotagiri' | 'Coonoor' | 'Gudalur';

export interface AppTrendItem {
  label: string;
  value: number;
  count: number;
}

export interface RatingTrendItem {
  label: string;
  value: number;
  rating: string;
}

export interface CropBreakdownItem {
  name: string;
  volume: string;
  pct: number;
  color: string;
}

export interface FarmerRosterItem {
  id: string;
  name: string;
  code: string;
  zone: string;
  crop: string;
  yieldMT: string;
  rating: number | null;
  status: string;
  cert: string;
  payout: string;
}

export interface FarmerPerformanceData {
  newApps: string;
  newAppsTrend: string;
  avgRating: string;
  avgRatingSub: string;
  ratingTrend: string;
  approvedListings: string;
  approvedTrend: string;
  activeFarmers: string;
  activeTrend: string;
  payoutsDisbursed: string;
  payoutsTrend: string;
  organicCert: string;
  organicTrend: string;
  appTrendH1: string;
  appTrendData: AppTrendItem[];
  ratingTrendTag: string;
  ratingTrendData: RatingTrendItem[];
  totalYieldSubtitle: string;
  cropBreakdown: CropBreakdownItem[];
  disbursedAmt: string;
  escrowAmt: string;
  holdAmt: string;
  farmersList: FarmerRosterItem[];
}

export interface FarmerPerformanceReportScreenProps {
  onBack: () => void;
}

export function FarmerPerformanceReportScreen({ onBack }: FarmerPerformanceReportScreenProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeFilter>('This Month');
  const [selectedCluster, setSelectedCluster] = useState<ClusterFilter>('All Clusters');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFarmerDetail, setSelectedFarmerDetail] = useState<FarmerRosterItem | null>(null);

  const timeframes: TimeframeFilter[] = ['This Month', 'Last Quarter', 'Year to Date'];
  const clusters: ClusterFilter[] = ['All Clusters', 'Ooty Central', 'Kotagiri', 'Coonoor', 'Gudalur'];

  const { items: farmers } = useFarmerList(undefined);
  const { summary: farmerSummary } = useFarmerSummary(undefined);

  const emptyData: FarmerPerformanceData = {
    newApps: ADMIN_NO_VALUE,
    newAppsTrend: ADMIN_NO_VALUE,
    avgRating: ADMIN_NO_VALUE,
    avgRatingSub: ADMIN_NO_VALUE,
    ratingTrend: ADMIN_NO_VALUE,
    approvedListings: ADMIN_NO_VALUE,
    approvedTrend: ADMIN_NO_VALUE,
    activeFarmers: ADMIN_NO_VALUE,
    activeTrend: ADMIN_NO_VALUE,
    payoutsDisbursed: ADMIN_NO_VALUE,
    payoutsTrend: ADMIN_NO_VALUE,
    organicCert: ADMIN_NO_VALUE,
    organicTrend: ADMIN_NO_VALUE,
    appTrendH1: ADMIN_NO_VALUE,
    appTrendData: [],
    ratingTrendTag: ADMIN_NO_VALUE,
    ratingTrendData: [],
    totalYieldSubtitle: ADMIN_NO_VALUE,
    cropBreakdown: [],
    disbursedAmt: ADMIN_NO_VALUE,
    escrowAmt: ADMIN_NO_VALUE,
    holdAmt: ADMIN_NO_VALUE,
    farmersList: [],
  };

  const liveFarmersList: FarmerRosterItem[] = React.useMemo(() => {
    if (!farmers || farmers.length === 0) return [];
    const filtered = selectedCluster === 'All Clusters'
      ? farmers
      : farmers.filter((f) => (f.zoneName ?? '').toLowerCase().includes(selectedCluster.replace(' Central', '').toLowerCase()));
    return filtered.map((f) => ({
      id: f.id,
      name: f.name,
      code: f.farmerCode,
      zone: f.zoneName || ADMIN_NO_VALUE,
      crop: ADMIN_NO_VALUE,
      yieldMT: ADMIN_NO_VALUE,
      rating: f.overallRating ?? null,
      status: f.status,
      cert: ADMIN_NO_VALUE,
      payout: ADMIN_NO_VALUE,
    }));
  }, [farmers, selectedCluster]);

  const currentData: FarmerPerformanceData = {
    ...emptyData,
    newApps: farmerSummary ? String(farmerSummary.pendingApplications) : ADMIN_NO_VALUE,
    activeFarmers: farmerSummary ? String(farmerSummary.activeFarmers) : ADMIN_NO_VALUE,
    farmersList: liveFarmersList,
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* ─── Top Header Navigation Bar ──────────────────────────────────────── */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to Reports"
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

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerActionBtnWhite}
              onPress={() => setShowExportModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.headerActionBtnWhiteText}>⬆ Export</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtnOrange}
              onPress={() => setShowShareModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.headerActionBtnOrangeText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Page Title Header ──────────────────────────────────────────────── */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Farmer Performance</Text>
          <Text style={styles.pageSubtitle}>
            Comprehensive yield, ratings, payouts & cluster analytics
          </Text>
        </View>

        {/* ─── Timeframe Selector Pills (This Month, Last Quarter, Year to Date) ─ */}
        <View style={styles.filterPillsRow}>
          {timeframes.map((t) => {
            const isActive = selectedTimeframe === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.timeframePill, isActive && styles.timeframePillActive]}
                onPress={() => setSelectedTimeframe(t)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timeframePillText,
                    isActive && styles.timeframePillTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Cluster Selector Pills (All Clusters, Ooty, Kotagiri, etc.) ───── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.clusterPillsScroll}
        >
          {clusters.map((c) => {
            const isSelected = selectedCluster === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.clusterPill, isSelected && styles.clusterPillActive]}
                onPress={() => setSelectedCluster(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.clusterPillText, isSelected && styles.clusterPillTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── 6 Dynamic KPI Metric Cards (using reusable OverviewDashboardCard) ─── */}
        <OverviewCardsGrid style={{ marginBottom: 16 }}>
          {/* 1. New Applications */}
          <OverviewDashboardCard
            value={currentData.newApps}
            title="New Applications"
            subtitle={currentData.newAppsTrend}
            icon="clipboard"
            titlePosition="bottom"
          />

          {/* 2. Avg Farm Rating */}
          <OverviewDashboardCard
            value={currentData.avgRating}
            title="Average Farm Rating"
            subtitle={currentData.ratingTrend}
            icon="orders"
            tone="success"
            titlePosition="bottom"
          />

          {/* 3. Approved Listings */}
          <OverviewDashboardCard
            value={currentData.approvedListings}
            title="Approved Listings"
            subtitle={currentData.approvedTrend}
            icon="box"
            tone="success"
            titlePosition="bottom"
          />

          {/* 4. Active Farmers */}
          <OverviewDashboardCard
            value={currentData.activeFarmers}
            title="Active Farmers"
            subtitle={currentData.activeTrend}
            icon="users"
            titlePosition="bottom"
          />

          {/* 5. Total Payouts Disbursed */}
          <OverviewDashboardCard
            value={currentData.payoutsDisbursed}
            title="Payouts Disbursed"
            subtitle={currentData.payoutsTrend}
            icon="sales"
            titlePosition="bottom"
          />

          {/* 6. Organic Certified */}
          <OverviewDashboardCard
            value={currentData.organicCert}
            title="Organic Certified"
            subtitle={currentData.organicTrend}
            icon="receiving"
            tone="success"
            titlePosition="bottom"
          />
        </OverviewCardsGrid>

        {/* ─── Chart 1: Application Trend ─────────────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Application Trend ({selectedTimeframe})</Text>
            <Text style={styles.chartMetricTag}>{currentData.appTrendH1}</Text>
          </View>
          <View style={styles.barChartContainer}>
            {currentData.appTrendData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValText}>{d.count}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: Math.min(75, d.value), backgroundColor: P.greenBar }]} />
                </View>
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Chart 2: Rating Trend ─────────────────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Rating Trend ({selectedCluster})</Text>
            <Text style={styles.chartMetricTag}>{currentData.ratingTrendTag}</Text>
          </View>
          <View style={styles.barChartContainer}>
            {currentData.ratingTrendData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barValText}>{d.rating}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: Math.min(75, d.value), backgroundColor: P.orange }]} />
                </View>
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Dynamic Crop Yield & Harvest Breakdown ─────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Harvest Yield Breakdown ({selectedCluster})</Text>
          <Text style={styles.cardHeaderSubtitle}>{currentData.totalYieldSubtitle}</Text>

          <View style={styles.produceList}>
            {currentData.cropBreakdown.map((crop, idx) => (
              <View key={idx} style={styles.produceRow}>
                <View style={styles.produceMetaRow}>
                  <Text style={styles.produceName}>{crop.name}</Text>
                  <Text style={styles.produceVolume}>{crop.volume}</Text>
                </View>
                <View style={styles.produceProgressTrack}>
                  <View
                    style={[
                      styles.produceProgressBar,
                      { width: `${crop.pct}%`, backgroundColor: crop.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Dynamic Farmer Settlement & Payout Status ──────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Payout Settlement Health</Text>
            <View style={styles.tagGreen}>
              <Text style={styles.tagGreenText}>{ADMIN_NO_VALUE}</Text>
            </View>
          </View>

          <View style={styles.payoutHealthRow}>
            <View style={styles.payoutCol}>
              <Text style={styles.payoutAmt}>{currentData.disbursedAmt}</Text>
              <Text style={styles.payoutStatusLabel}>✓ Disbursed (UPI/Bank)</Text>
            </View>
            <View style={styles.payoutCol}>
              <Text style={styles.payoutAmtAmber}>{currentData.escrowAmt}</Text>
              <Text style={styles.payoutStatusLabel}>⌛ Escrow Clearance</Text>
            </View>
            <View style={styles.payoutCol}>
              <Text style={styles.payoutAmtMuted}>{currentData.holdAmt}</Text>
              <Text style={styles.payoutStatusLabel}>⚑ Verification Hold</Text>
            </View>
          </View>
        </View>

        {/* ─── Filtered Top Farmers Table ─────────────────────────────────────── */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <View>
              <Text style={styles.tableTitle}>Top Farmers ({selectedCluster})</Text>
              <Text style={styles.tableSubtitle}>
                Filtered by {selectedCluster} · {selectedTimeframe}
              </Text>
            </View>
            <View style={{ opacity: 0.45 }}>
              <Text style={styles.viewAllText}>View All {currentData.activeFarmers}</Text>
            </View>
          </View>

          {/* Table Column Headers */}
          <View style={styles.columnHeaderRow}>
            <Text style={[styles.colLabel, { flex: 2 }]}>Farmer</Text>
            <Text style={[styles.colLabel, { flex: 1.2 }]}>Zone</Text>
            <Text style={[styles.colLabel, { flex: 1.2 }]}>Produce</Text>
            <Text style={[styles.colLabel, { flex: 1, textAlign: 'center' }]}>Rating</Text>
            <Text style={[styles.colLabel, { flex: 1.2, textAlign: 'right' }]}>Status</Text>
          </View>

          {/* Table Rows */}
          {currentData.farmersList.length === 0 ? (
            <AdminEmptyState
              title="No farmers found"
              subtitle={`No registered farmers in ${selectedCluster}.`}
            />
          ) : (
            currentData.farmersList.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.tableRow}
                onPress={() => setSelectedFarmerDetail(f)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 2 }}>
                  <Text style={styles.cellTextBold} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.cellTextCode}>{f.code}</Text>
                </View>

                <Text style={[styles.cellTextMuted, { flex: 1.2 }]} numberOfLines={1}>{f.zone}</Text>

                <View style={{ flex: 1.2 }}>
                  <Text style={styles.cellTextProduce} numberOfLines={1}>{f.crop}</Text>
                  <Text style={styles.cellTextYield}>{f.yieldMT}</Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>
                      {f.rating !== null ? String(f.rating) : ADMIN_NO_VALUE}
                    </Text>
                  </View>
                </View>

                <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.statusPill,
                      f.status.toLowerCase() === 'active' ? styles.statusPillActive : styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        f.status.toLowerCase() === 'active' ? styles.statusPillTextActive : styles.statusPillTextPending,
                      ]}
                    >
                      {f.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ─── Farmer Detail Inspection Modal ─────────────────────────────────── */}
      <Modal
        visible={!!selectedFarmerDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFarmerDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.tagGreen}>
                <Text style={styles.tagGreenText}>{selectedFarmerDetail?.cert}</Text>
              </View>
              <Text style={styles.modalRating}>
                ★ {selectedFarmerDetail?.rating != null ? `${selectedFarmerDetail.rating}/10` : ADMIN_NO_VALUE}
              </Text>
            </View>

            <Text style={styles.modalTitle}>{selectedFarmerDetail?.name}</Text>
            <Text style={styles.modalSub}>{selectedFarmerDetail?.code} · {selectedFarmerDetail?.zone} Zone</Text>

            <View style={styles.modalDivider} />

            <View style={styles.farmerDetailGrid}>
              <View style={styles.farmerDetailItem}>
                <Text style={styles.detailLabel}>Primary Crop</Text>
                <Text style={styles.detailVal}>{selectedFarmerDetail?.crop}</Text>
              </View>
              <View style={styles.farmerDetailItem}>
                <Text style={styles.detailLabel}>Selected Harvest</Text>
                <Text style={styles.detailVal}>{selectedFarmerDetail?.yieldMT}</Text>
              </View>
              <View style={styles.farmerDetailItem}>
                <Text style={styles.detailLabel}>Settled Payout</Text>
                <Text style={styles.detailVal}>{selectedFarmerDetail?.payout}</Text>
              </View>
              <View style={styles.farmerDetailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailVal}>{selectedFarmerDetail?.status}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setSelectedFarmerDetail(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Export Modal ───────────────────────────────────────────────────── */}
      <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Export Farmer Performance Report</Text>
            <Text style={styles.modalSub}>
              {t('wiringReports.reports.exportUnavailable')}
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { opacity: 0.45 }]}
              disabled
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.modalBtnText}>Download PDF Statement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: P.cardBg, borderWidth: 1, borderColor: P.cardBorder, marginTop: 10, opacity: 0.45 }]}
              disabled
              accessibilityState={{ disabled: true }}
            >
              <Text style={[styles.modalBtnText, { color: P.ink }]}>Export Excel (XLSX)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { marginTop: 10 }]}
              onPress={() => setShowExportModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Share Modal ────────────────────────────────────────────────────── */}
      <Modal visible={showShareModal} transparent animationType="fade" onRequestClose={() => setShowShareModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Share Farmer Performance</Text>
            <Text style={styles.modalSub}>{t('wiringReports.reports.exportUnavailable')}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, { opacity: 0.45 }]}
              disabled
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.modalBtnText}>Copy Link & Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { marginTop: 10 }]}
              onPress={() => setShowShareModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 14,
    paddingBottom: 80,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtnWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E0D8',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  headerActionBtnWhiteText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.ink,
  },
  headerActionBtnOrange: {
    backgroundColor: P.orange,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  headerActionBtnOrangeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Title Block
  headerBlock: {
    marginBottom: 16,
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

  // Timeframe Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  timeframePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: P.cardBorder,
  },
  timeframePillActive: {
    backgroundColor: P.orange,
    borderColor: P.orange,
  },
  timeframePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: P.textSecondary,
  },
  timeframePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Cluster Scroll
  clusterPillsScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 16,
  },
  clusterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: P.cardBorder,
    marginRight: 8,
  },
  clusterPillActive: {
    backgroundColor: '#FFF1EB',
    borderColor: P.orange,
  },
  clusterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.textSecondary,
  },
  clusterPillTextActive: {
    color: P.orange,
    fontWeight: '700',
  },

  // 6 KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: P.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: P.subtitle,
    fontWeight: '600',
    marginBottom: 6,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  kpiSubNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: P.subtitle,
  },
  kpiTrendGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  kpiTrendSub: {
    fontSize: 11,
    fontWeight: '600',
    color: P.textSecondary,
  },

  // Charts
  chartCard: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  chartMetricTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    paddingTop: 8,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValText: {
    fontSize: 10,
    fontWeight: '700',
    color: P.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    height: 75,
    width: 26,
    backgroundColor: '#F7F5F0',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: P.subtitle,
    marginTop: 6,
    fontWeight: '500',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: P.subtitle,
    marginBottom: 14,
  },

  // Crop Produce List
  produceList: {
    gap: 12,
  },
  produceRow: {},
  produceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  produceName: {
    fontSize: 13,
    fontWeight: '600',
    color: P.ink,
  },
  produceVolume: {
    fontSize: 13,
    fontWeight: '700',
    color: P.textSecondary,
  },
  produceProgressTrack: {
    height: 7,
    backgroundColor: '#F3EFE9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  produceProgressBar: {
    height: '100%',
    borderRadius: 4,
  },

  // Payout Settlement Health
  payoutHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
  },
  payoutCol: {
    alignItems: 'center',
  },
  payoutAmt: {
    fontSize: 15,
    fontWeight: '800',
    color: P.greenSuccess,
    marginBottom: 2,
  },
  payoutAmtAmber: {
    fontSize: 15,
    fontWeight: '800',
    color: P.amberIcon,
    marginBottom: 2,
  },
  payoutAmtMuted: {
    fontSize: 15,
    fontWeight: '800',
    color: P.textSecondary,
    marginBottom: 2,
  },
  payoutStatusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: P.subtitle,
  },

  // Table Card
  tableCard: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.ink,
  },
  tableSubtitle: {
    fontSize: 12,
    color: P.subtitle,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.greenSuccess,
  },
  columnHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E8',
    marginBottom: 6,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: P.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  cellTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: P.ink,
  },
  cellTextCode: {
    fontSize: 10.5,
    color: P.subtitle,
  },
  cellTextMuted: {
    fontSize: 12.5,
    color: P.textSecondary,
  },
  cellTextProduce: {
    fontSize: 12,
    fontWeight: '600',
    color: P.ink,
  },
  cellTextYield: {
    fontSize: 10.5,
    color: P.subtitle,
  },
  ratingBadge: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillActive: {
    backgroundColor: '#EAF7EE',
  },
  statusPillPending: {
    backgroundColor: '#FEF3E2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#166534',
  },
  statusPillTextPending: {
    color: '#B45309',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
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
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagGreen: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  modalRating: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.ink,
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 12.5,
    color: P.subtitle,
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F3EFE9',
    marginBottom: 14,
  },
  farmerDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  farmerDetailItem: {
    width: '47%',
  },
  detailLabel: {
    fontSize: 11.5,
    color: P.subtitle,
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  modalBtn: {
    backgroundColor: P.orange,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default FarmerPerformanceReportScreen;
