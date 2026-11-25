import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Line, Path } from 'react-native-svg';
import type { RecentDocItem } from './AdminReportsMainScreen';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

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

function DownloadIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10l5 5 5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface RecentReportDetailScreenProps {
  doc: RecentDocItem;
  onBack: () => void;
  onOpenLiveModule: () => void;
}

export function RecentReportDetailScreen({
  doc,
  onBack,
  onOpenLiveModule,
}: RecentReportDetailScreenProps) {

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header Band matching Admin Standard */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleGroup}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Back to reports"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Details</Text>
          </View>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>✓ SA/TA Verified</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Official platform archival record & executive audit</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Document Details Card */}
        <View style={styles.mainDocCard}>
          <View style={styles.tagRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{doc.categoryBadge}</Text>
            </View>
            <View style={styles.formatPill}>
              <Text style={styles.formatPillText}>
                {doc.fileFormat}{doc.fileSize !== ADMIN_NO_VALUE ? ` · ${doc.fileSize}` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.docTitle}>{doc.title}</Text>
          <Text style={styles.docDate}>{doc.dateStr}</Text>

          <View style={styles.divider} />

          {/* Executive Summary Highlights */}
          <Text style={styles.sectionHeading}>Executive Summary Highlights</Text>
          <View style={styles.metricsGrid}>
            {doc.summaryMetrics.map((m, i) => (
              <View key={i} style={styles.metricItem}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricVal}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Audit & Compliance Specifications Card */}
        <View style={styles.specsCard}>
          <Text style={styles.specsTitle}>Audit & Verification Specifications</Text>

          <View style={styles.specRow}>
            <Text style={styles.specKey}>Document Serial</Text>
            <Text style={styles.specVal}>TOHFA-REP-{doc.id.toUpperCase()}-2026</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specKey}>Compliance Status</Text>
            <Text style={[styles.specVal, { color: adminColors.success.text, fontWeight: '700' }]}>
              100% Passed (Statutory & GST)
            </Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specKey}>Cryptographic Seal</Text>
            <Text style={styles.specVal}>SHA-256 Verified Signature</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specKey}>Archival Storage</Text>
            <Text style={styles.specVal}>Encrypted Cold Tier-4 Cloud</Text>
          </View>

          <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.specKey}>Authorized Sign-off</Text>
            <Text style={styles.specVal}>Tohfa Internal Audit Committee</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.downloadPrimaryBtn, { opacity: 0.45 }]}
            disabled
            accessibilityState={{ disabled: true }}
            accessibilityHint={t('wiringReports.reports.downloadUnavailable')}
            activeOpacity={0.85}
          >
            <DownloadIcon size={20} color={adminColors.onBrand} />
            <Text style={styles.downloadPrimaryBtnText}>
              Download {doc.fileFormat.includes('Excel') ? 'Spreadsheet' : 'Document'}{doc.fileSize !== ADMIN_NO_VALUE ? ` (${doc.fileSize})` : ''}
            </Text>
          </TouchableOpacity>
          <Text style={styles.specKey}>{t('wiringReports.reports.downloadUnavailable')}</Text>

          <TouchableOpacity
            style={styles.openLiveBtn}
            onPress={onOpenLiveModule}
            activeOpacity={0.8}
          >
            <Text style={styles.openLiveBtnText}>View Live Interactive Module →</Text>
          </TouchableOpacity>
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
  verifiedTag: {
    backgroundColor: adminOverlay.whitePill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: adminRadius.full,
  },
  verifiedTagText: {
    ...adminType.caption,
    color: adminColors.onBrand,
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
  mainDocCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 18,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  categoryBadgeText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  formatPill: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  formatPillText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  docTitle: {
    ...adminType.rowTitle,
    fontSize: 18,
    color: adminColors.ink,
    marginBottom: 6,
  },
  docDate: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 16,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricItem: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    padding: 12,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
  },
  metricLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  metricVal: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
  },
  specsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 18,
    marginBottom: 20,
    ...adminShadow.sm,
  },
  specsTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  specKey: {
    ...adminType.body,
    color: adminColors.muted,
  },
  specVal: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
  },
  downloadPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    paddingVertical: 15,
    gap: 8,
  },
  downloadPrimaryBtnText: {
    color: adminColors.onBrand,
    ...adminType.rowTitle,
    fontWeight: '700',
  },
  openLiveBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  openLiveBtnText: {
    color: adminColors.brand,
    ...adminType.rowTitle,
    fontWeight: '700',
  },
});

export default RecentReportDetailScreen;
