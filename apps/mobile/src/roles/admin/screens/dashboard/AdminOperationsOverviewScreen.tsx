import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AdminOperationsOverviewScreenProps {
  onBack: () => void;
  onExportReports?: () => void;
}

// ─── Header & Section Icons ──────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClockOrangeIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function AdminOperationsOverviewScreen({
  onBack,
  onExportReports,
}: AdminOperationsOverviewScreenProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleExport = () => {
    if (onExportReports) {
      onExportReports();
    } else {
      Alert.alert(
        'Export Reports',
        'Operational overview reports exported successfully in PDF and Excel formats.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner in Brand Orange #F0562A */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <BackArrowWhiteIcon />
            <Text style={styles.headerTitle}>Operations Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerFilterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <FilterSlidersIcon />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section A: Farmers and compliance ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>A · Farmers and compliance</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Total farmers</Text>
              <Text style={styles.rowValue}>24</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Active / inactive / terminated</Text>
              <Text style={styles.rowValue}>20 / 2 / 2</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Applications awaiting decision</Text>
              <Text style={styles.rowValue}>4</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>KYC verified / review required</Text>
              <Text style={styles.rowValue}>22 / 2</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Audits upcoming / overdue</Text>
              <Text style={styles.rowValue}>2 / 1</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Certification expired / expiring soon</Text>
              <Text style={styles.rowValue}>1 / 3</Text>
            </View>
          </View>
        </View>

        {/* ── Section B: Produce and crop operations ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>B · Produce and crop operations</Text>

          {/* Listings Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Listings (all statuses)</Text>
              <Text style={styles.rowValue}>10</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Pending Review</Text>
              <Text style={styles.rowValue}>5</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Approved</Text>
              <Text style={styles.rowValue}>4</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Rejected</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
          </View>

          {/* By Crop */}
          <Text style={styles.subHeading}>By crop</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Beans</Text>
              <Text style={styles.rowValue}>2</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Cabbage</Text>
              <Text style={styles.rowValue}>2</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Carrot</Text>
              <Text style={styles.rowValue}>2</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Garlic</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Potato</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Tomato</Text>
              <Text style={styles.rowValue}>2</Text>
            </View>
          </View>

          {/* By Zone */}
          <Text style={styles.subHeading}>By zone</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Coonoor</Text>
              <Text style={styles.rowValue}>4</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Gudalur</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Kotagiri</Text>
              <Text style={styles.rowValue}>2</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Ooty</Text>
              <Text style={styles.rowValue}>3</Text>
            </View>
          </View>

          <Text style={styles.subNote}>
            Filters applied here: Zone, Farmer, Crop. Listings are current, so the date range does not apply. Harvest forecasts and produce availability exceptions are not part of the data supplied.
          </Text>
        </View>

        {/* ── Section C: Purchase and receiving ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>C · Purchase and receiving</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Purchase orders in the selection</Text>
              <Text style={styles.rowValue}>3</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Awaiting Processing</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Awaiting Receipt</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Received</Text>
              <Text style={styles.rowValue}>0</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Quality Check</Text>
              <Text style={styles.rowValue}>0</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Quality Approved</Text>
              <Text style={styles.rowValue}>1</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Quality Rejected</Text>
              <Text style={styles.rowValue}>0</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Closed</Text>
              <Text style={styles.rowValue}>0</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Awaiting quality review</Text>
              <Text style={styles.rowValue}>0</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Open discrepancies</Text>
              <Text style={styles.rowValue}>0</Text>
            </View>
          </View>

          <Text style={styles.subNote}>
            Filters applied here: Date range, Warehouse, Zone, Farmer, Crop.
          </Text>
        </View>

        {/* ── Section D: Warehouse overview ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>D · Warehouse overview</Text>

          {/* Ooty */}
          <View style={styles.card}>
            <View style={styles.warehouseTopRow}>
              <Text style={styles.warehouseTitle}>Ooty</Text>
              <View style={styles.badgeActive}>
                <Text style={styles.badgeActiveText}>Active</Text>
              </View>
            </View>

            <View style={styles.warehouseStatsGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Available stock</Text>
                <Text style={styles.statValue}>1290 KG</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Incoming goods</Text>
                <Text style={styles.statValue}>1</Text>
              </View>
            </View>

            <View style={[styles.warehouseStatsGrid, { marginTop: adminSpacing.sm }]}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Pending quality checks</Text>
                <Text style={styles.statValue}>1</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Unresolved stock issues</Text>
                <Text style={styles.statValue}>0</Text>
              </View>
            </View>

            <Text style={styles.warehouseMeta}>Updated 12 Oct 2026, 08:40</Text>
          </View>

          {/* Gudalur Market */}
          <View style={[styles.card, { marginTop: adminSpacing.md }]}>
            <View style={styles.warehouseTopRow}>
              <Text style={styles.warehouseTitle}>Gudalur Market</Text>
              <View style={styles.badgePending}>
                <Text style={styles.badgePendingText}>Pending Activation</Text>
              </View>
            </View>
            <Text style={styles.warehouseSubText}>Not active yet, so there is no stock data.</Text>
          </View>
        </View>

        {/* ── Section E: Operations timeline ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>E · Operations timeline</Text>

          {[
            {
              id: '1',
              title: 'Farmer application approved',
              meta: 'APP-2026-0108 · 11 Oct 2026, 16:40',
              actor: 'Priya Nair · Approved',
            },
            {
              id: '2',
              title: 'KYC verification updated',
              meta: 'FMR-00177 · 11 Oct 2026, 15:05',
              actor: 'Priya Nair · Verified',
            },
            {
              id: '3',
              title: 'Retail price change submitted for review',
              meta: 'PRC-003 · 11 Oct 2026, 12:30',
              actor: 'Priya Nair · Pending review',
            },
            {
              id: '4',
              title: 'Quality discrepancy recorded',
              meta: 'PO-2026-00311 · 10 Oct 2026, 18:22',
              actor: 'Warehouse staff · Rejected',
            },
            {
              id: '5',
              title: 'Customer ticket updated',
              meta: 'TKT-2026-0504 · 10 Oct 2026, 12:10',
              actor: 'Support · Resolved',
            },
            {
              id: '6',
              title: 'Payment status changed: sent for Super Admin approval',
              meta: 'PAY-2026-0404 · 9 Oct 2026, 17:30',
              actor: 'Priya Nair · Awaiting approval',
            },
            {
              id: '7',
              title: 'Audit completed',
              meta: 'AUD-2026-0056 · 8 Oct 2026, 11:15',
              actor: 'Auditor · Completed',
            },
            {
              id: '8',
              title: 'Warehouse activation requested',
              meta: 'Gudalur Market · 7 Oct 2026, 10:00',
              actor: 'Priya Nair · Pending activation',
            },
            {
              id: '9',
              title: 'Farmer application rejected',
              meta: 'APP-2026-0109 · 6 Oct 2026, 10:00',
              actor: 'Priya Nair · Rejected',
            },
          ].map((item) => (
            <View key={item.id} style={styles.activityItemRow}>
              <ClockOrangeIcon />
              <View style={styles.activityContentCol}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityMeta}>{item.meta}</Text>
                <Text style={styles.activityActor}>{item.actor}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Export Reports Button in Brand Orange #F0562A ── */}
        <View style={styles.exportButtonContainer}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport} activeOpacity={0.8}>
            <Text style={styles.exportButtonText}>Export reports</Text>
          </TouchableOpacity>
          <Text style={styles.footerCaption}>M1-S04 · Operations Overview</Text>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Operations</Text>
            {['All Warehouses', 'Ooty Warehouse', 'Coonoor Warehouse', 'Kotagiri Warehouse', 'Gudalur Market'].map((wh) => (
              <TouchableOpacity
                key={wh}
                style={styles.modalOption}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalOptionText}>{wh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: adminSpacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionContainer: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  subHeading: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  rowLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  rowValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  subNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    lineHeight: 15,
  },

  // Warehouse Overview Card
  warehouseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  warehouseTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 15,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgeActiveText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgePendingText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontWeight: '700',
  },
  warehouseStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  statValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
  },
  warehouseMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    paddingVertical: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    marginTop: adminSpacing.sm,
  },
  warehouseSubText: {
    ...adminType.body,
    color: adminColors.muted,
    paddingBottom: adminSpacing.md,
    fontSize: 12,
  },

  // Activity Timeline
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  activityContentCol: {
    flex: 1,
  },
  activityTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  activityMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  activityActor: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },

  // Export Reports Button
  exportButtonContainer: {
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  exportButton: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  exportButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
  },
  footerCaption: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.md,
  },

  // Filter Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    textAlign: 'center',
  },
});
